import React, { useState, useEffect, useRef, Component } from 'react'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import ProductCard from './components/ProductCard'
import ProductModal from './components/ProductModal'
import MapCard from './components/MapCard'
import AuthModal from './components/AuthModal'
import Footer from './components/Footer'
import Drawer from './components/Drawer'
import { X } from 'lucide-react'
import ToastContainer from './components/ToastContainer'
import BackToTop from './components/BackToTop'
import { secureStorage } from './utils/secureStorage';

import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider, useWishlist } from './context/WishlistContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { UserProvider } from './context/UserContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { ConfirmProvider } from './context/ConfirmContext';

import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Favorites from './pages/Favorites';
import Orders from './pages/Orders';
import Notifications from './pages/Notifications';
import Transactions from './pages/Transactions';
import Support from './pages/Support';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CookiePolicy from './pages/CookiePolicy';
import ShippingInfo from './pages/ShippingInfo';
import Returns from './pages/Returns';
import FAQ from './pages/FAQ';
import { fetchOrders, fetchProducts } from './services/api';
import { useUser } from './context/UserContext';
import { formatRelativeTime, formatDate } from './utils/dateFormatter';
import MaintenancePage from './pages/MaintenancePage';
import ResetPassword from './pages/ResetPassword';
import TrackOrder from './pages/TrackOrder';
import CMSPage from './pages/CMSPage';
import OrderSuccess from './pages/OrderSuccess';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser, login: handleContextLogin, logout, authModal, openAuthModal, closeAuthModal } = useUser();
  const { siteSettings, formatPrice } = useSettings();
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const lastFetchRef = React.useRef(0); 

  // Check maintenance mode from backend
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const checkMaintenance = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_products.php?limit=1`, {
          // Note: credentials 'include' ensures cookies are sent automatically
        });
        if (res.status === 503) {
          const data = await res.json();
          // Even if 503, Super Admins should bypass
          if (data.maintenance === true) {
            // Check for bypass using the last active user ID
            const lastId = localStorage.getItem('ehub_last_user_id');
            const ehub_user = lastId ? secureStorage.getItem('user', lastId) : null;
            
            if (ehub_user && ehub_user.role === 'super') {
              setIsMaintenanceMode(false);
            } else {
              setIsMaintenanceMode(true);
            }
          }
        } else {
          setIsMaintenanceMode(false);
        }
      } catch {}
    };
    checkMaintenance();
    const intervalId = setInterval(checkMaintenance, 300000); // re-check every 5 minutes
    return () => clearInterval(intervalId);
  }, []);

  const [redirectPath, setRedirectPath] = useState(null);
  const [activeDrawer, setActiveDrawer] = useState(null); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]); // Start empty, fetch from API
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToast, addNotification, notifications, deleteNotification } = useNotifications();
  const maintenanceRef = useRef(isMaintenanceMode);

  // Handle social login redirects
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('social_token');
    const encodedUser = params.get('social_user');
    const error = params.get('social_error');

    if (token && encodedUser) {
      try {
        const rawUser = JSON.parse(atob(decodeURIComponent(encodedUser)));
        const userObj = {
          id: rawUser.id,
          name: rawUser.name,
          email: rawUser.email,
          phone: rawUser.phone || '',
          address: rawUser.address || '',
          level: rawUser.level || 1,
          levelName: rawUser.level_name || 'Starter',
          avatar: rawUser.avatar_text || (rawUser.name ? rawUser.name.slice(0, 2).toUpperCase() : '??'),
          profileImage: rawUser.profile_image || null,
          role: rawUser.role || 'customer',
          email_notif: rawUser.email_notif !== undefined ? Boolean(rawUser.email_notif) : true,
          push_notif: rawUser.push_notif !== undefined ? Boolean(rawUser.push_notif) : true,
          sms_tracking: rawUser.sms_tracking !== undefined ? Boolean(rawUser.sms_tracking) : true,
          theme: rawUser.theme || 'blue',
        };
        // Pass both user and token to the centralized login handler
        handleContextLogin(userObj, token);
        addToast("Login successful!", "success");
        // Clear the URL immediately to prevent re-processing and clean history
        navigate('/', { replace: true });
      } catch (e) {
        console.error('Failed to parse social user:', e);
      }
    } else if (error) {
      addToast(decodeURIComponent(error), "error");
      navigate('/', { replace: true });
    }
  }, [navigate, updateUser, addToast, addNotification]);

  useEffect(() => {
    maintenanceRef.current = isMaintenanceMode;
  }, [isMaintenanceMode]);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark-mode', isDarkMode);
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  // Apply dynamic site branding
  useEffect(() => {
    const { primaryColor, accentColor, headerBg, fontFamily, siteName, faviconUrl, maintenanceMode } = siteSettings;
    
    if (primaryColor) {
      document.documentElement.style.setProperty('--primary-blue', primaryColor);
      document.documentElement.style.setProperty('--primary-blue-hover', `${primaryColor}CC`);
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246';
      };
      document.documentElement.style.setProperty('--primary-rgb', hexToRgb(primaryColor));
    }

    if (accentColor) {
      document.documentElement.style.setProperty('--primary-gold', accentColor);
    }

    if (headerBg) {
      document.documentElement.style.setProperty('--top-nav-bg', headerBg);
    }
    
    if (fontFamily) {
      document.documentElement.style.setProperty('--font-main', fontFamily);
      document.body.style.fontFamily = `'${fontFamily}', sans-serif`;
    }

    if (siteName && !location.pathname.includes('/settings')) {
       document.title = `${siteName} | Your Tech Partner`;
    }
    
    if (faviconUrl) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [siteSettings, location.pathname]);

  const productsRef = useRef(products);

  useEffect(() => {
      productsRef.current = products;
  }, [products]);

  const loadProducts = async () => {
    try {
      if (productsRef.current.length === 0) setLoading(true);
      
      const mappedProducts = await fetchProducts();
      if (mappedProducts && Array.isArray(mappedProducts)) {
          
          setProducts(prevProducts => {
            const isDifferent = JSON.stringify(prevProducts) !== JSON.stringify(mappedProducts);
            return isDifferent ? mappedProducts : prevProducts;
          });
          
          lastFetchRef.current = Date.now();

          if (mappedProducts.length === 0 && productsRef.current.length === 0) {
             addToast("Product catalog is currently empty", "info");
          }
      } else {
          throw new Error("Invalid data format from server");
      }
    } catch (error) {
      if (error.maintenance) {
        setIsMaintenanceMode(true);
        return; 
      }
      if (productsRef.current.length === 0 && !maintenanceRef.current) {
          console.error(`API Error: ${error.message}`);
      }
    } finally {
      if (productsRef.current.length === 0) setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(); 
    const handleFocus = () => {
        if (Date.now() - lastFetchRef.current > 30000) {
            loadProducts();
        }
    };
    window.addEventListener('focus', handleFocus);
    return () => {
        window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      const latest = products.find(p => p.id === selectedProduct.id);
      if (latest && JSON.stringify(latest) !== JSON.stringify(selectedProduct)) {
        setSelectedProduct(latest);
      }
    }
  }, [products, selectedProduct]);

  // Listen for global 401 Unauthorized events from apiFetch
  useEffect(() => {
    const handleUnauthorized = () => {
        if (user) {
            logout();
            addToast("Session expired. Please login again.", "info");
        }
    };
    
    // Custom event dispatched from api.js when a 401 response is received
    window.addEventListener('auth_unauthorized', handleUnauthorized);
    
    return () => {
        window.removeEventListener('auth_unauthorized', handleUnauthorized);
    };
  }, [user, logout, addToast]);

  useEffect(() => {
    if (user && activeDrawer === 'orders') {
        const loadOrders = async () => {
            try {
                const data = await fetchOrders(user.id);
                setOrders(data);
            } catch (error) {}
        };
        loadOrders();
    }
  }, [user, activeDrawer]);

  const closeDrawers = () => setActiveDrawer(null);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Phase 7: Track product views locally for personalized sorting
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    try {
      const historyStr = localStorage.getItem('ehub_view_history');
      const history = historyStr ? JSON.parse(historyStr) : {};
      history[product.id] = (history[product.id] || 0) + 1;
      localStorage.setItem('ehub_view_history', JSON.stringify(history));

      const recentStr = localStorage.getItem('ehub_recent_views');
      const recent = Array.isArray(JSON.parse(recentStr || '[]')) ? JSON.parse(recentStr || '[]') : [];
      const nextRecent = [product.id, ...recent.filter((id) => id !== product.id)].slice(0, 20);
      localStorage.setItem('ehub_recent_views', JSON.stringify(nextRecent));

      const categoryStr = localStorage.getItem('ehub_category_affinity');
      const categoryAffinity = categoryStr ? JSON.parse(categoryStr) : {};
      const categoryKey = (product.category || 'uncategorized').toLowerCase();
      categoryAffinity[categoryKey] = (categoryAffinity[categoryKey] || 0) + 1;
      localStorage.setItem('ehub_category_affinity', JSON.stringify(categoryAffinity));
    } catch (e) {
      console.warn('Failed to save view history:', e);
    }
  };

  useEffect(() => {
    const protectedRoutes = ['/settings', '/transactions', '/profile', '/orders', '/notifications', '/cart'];
    if (protectedRoutes.includes(location.pathname) && !user) {
       setRedirectPath(location.pathname);
       navigate('/');
       openAuthModal('signin');
    }
  }, [location.pathname, user, navigate]);

  useEffect(() => {
    if (user && redirectPath) {
      navigate(redirectPath);
      setRedirectPath(null);
    }
  }, [user, redirectPath, navigate]);

  const handleAddToCart = (product, qty, color) => {
    addToCart(product, qty, color);
    addToast(`Added ${product.name} to cart`, 'info');
  };

  const handleAddToWishlist = (product) => {
    toggleWishlist(product);
    const isNowIn = !isInWishlist(product.id);
    addToast(
      isNowIn ? `Added ${product.name} to wishlist` : `Removed ${product.name} from wishlist`, 
      'info'
    );
  };

  if (isMaintenanceMode || siteSettings.maintenanceMode) return <MaintenancePage />;

  return (
    <div className={`app-root ${isDarkMode ? 'dark-mode' : ''}`}>
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOrdersClick={() => setActiveDrawer('orders')} 
        onNotificationsClick={() => setActiveDrawer('notifications')} 
        onMapClick={() => setActiveDrawer('map')}
      />
      
      <div className="main-wrapper">
        <Navbar 
          onLoginClick={() => openAuthModal('signin')} 
          onMapClick={() => setActiveDrawer('map')}
          onMenuClick={toggleSidebar}
          onThemeToggle={toggleDarkMode}
          onProductClick={handleProductClick}
          onNotificationsClick={() => setActiveDrawer('notifications')}
          isDarkMode={isDarkMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          products={products}
        />

        <ScrollToTop />

        <main className="dashboard-grid full-width">
          <Routes>
            <Route path="/" element={<Home products={products} onProductClick={handleProductClick} searchQuery={searchQuery} loading={loading} />} />
            <Route path="/shop" element={<Shop products={products} onProductClick={handleProductClick} searchQuery={searchQuery} loading={loading} />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/favorites" element={<Favorites onProductClick={handleProductClick} searchQuery={searchQuery} />} />
            <Route path="/orders" element={<Orders searchQuery={searchQuery} />} />
            <Route path="/notifications" element={<Notifications searchQuery={searchQuery} />} />
            <Route path="/support" element={<Support searchQuery={searchQuery} />} />
            <Route path="/settings" element={<Settings searchQuery={searchQuery} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/transactions" element={<Transactions />} />

            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/shipping-info" element={<ShippingInfo />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/track" element={<TrackOrder />} />
            <Route path="/p/:slug" element={<CMSPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>

      <ProductModal 
        product={selectedProduct}
        products={products}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onAddToWishlist={handleAddToWishlist}
        onProductClick={setSelectedProduct}
      />

      <AuthModal 
        isOpen={authModal.isOpen} 
        initialMode={authModal.mode}
        onClose={() => {
            closeAuthModal();
        }} 
      />

      <Drawer 
        id="drawer-map" 
        title="Our Location" 
        isOpen={activeDrawer === 'map'} 
        onClose={closeDrawers}
      >
        <MapCard />
      </Drawer>

      <Drawer 
        id="drawer-orders" 
        title="My Orders" 
        isOpen={activeDrawer === 'orders'} 
        onClose={closeDrawers}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!user ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Please login to view your orders.
            </div>
          ) : !Array.isArray(orders) || orders.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No orders found.
            </div>
          ) : (
            orders.map(order => (
                <div key={order.id} style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', fontSize: '14px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ color: 'var(--text-main)' }}>#{order.id}</strong>
                    <span style={{ 
                        color: (order.status || 'pending') === 'completed' ? 'var(--success)' : ((order.status || 'pending') === 'pending' ? 'var(--warning)' : 'var(--accent-blue)'), 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        background: (order.status || 'pending') === 'completed' ? 'var(--success-bg)' : ((order.status || 'pending') === 'pending' ? 'var(--warning-bg)' : 'var(--info-bg)'), 
                        padding: '2px 8px', 
                        borderRadius: '10px' 
                    }}>
                        {order.status || 'pending'}
                    </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        {formatDate(order.created_at)}
                    </div>
                    <div style={{ marginTop: '8px', fontWeight: 600 }}>{formatPrice(order.total_amount || 0)}</div>
                </div>
            ))
          )}
        </div>
      </Drawer>

      <Drawer 
        id="drawer-notifications" 
        title="Recent Updates" 
        isOpen={activeDrawer === 'notifications'} 
        onClose={closeDrawers}
      >
        <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No new notifications</div>
          ) : (
            notifications.map(notif => (
              <div key={notif.id} className="notification-item" style={{ padding: '12px', background: 'var(--bg-main)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', border: '1px solid var(--border-light)' }}>
                <div>
                   <span style={{ display: 'block', marginBottom: '4px' }}>{notif.text}</span>
                   <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatRelativeTime(notif.time)}</span>
                </div>
                <X size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)', minWidth: '14px' }} onClick={() => deleteNotification(notif.id)} />
              </div>
            ))
          )}
        </div>
      </Drawer>
      <ToastContainer />
      <BackToTop />
    </div>
  );
}

const AppProviders = ({ children }) => {
  const { user } = useUser();
  return (
    <div key={user?.id} style={{ display: 'contents' }}>
      <ConfirmProvider>
        <NotificationProvider>
          <SettingsProvider>
            <WishlistProvider>
              <CartProvider>
                  {children}
              </CartProvider>
            </WishlistProvider>
          </SettingsProvider>
        </NotificationProvider>
      </ConfirmProvider>
    </div>
  );
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("React Error Boundary Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '50px', background: '#fee2e2', color: '#991b1b', minHeight: '100vh' }}>
          <h1>Something went wrong.</h1>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px', background: '#fff', padding: '20px', border: '1px solid #fca5a5' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <UserProvider>
      <AppProviders>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AppProviders>
    </UserProvider>
  );
}
