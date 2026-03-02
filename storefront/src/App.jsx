import { useState, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import ProductCard from './components/ProductCard'
import ProductModal from './components/ProductModal'
import MapCard from './components/MapCard'
import AuthModal from './components/AuthModal'
import Footer from './components/Footer'
import Drawer from './components/Drawer'
import { X } from 'lucide-react'

import { initialProducts } from './constants'; // Keep for structure but unused
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider, useWishlist } from './context/WishlistContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { UserProvider } from './context/UserContext';
import { WalletProvider } from './context/WalletContext';
import { SettingsProvider } from './context/SettingsContext';

import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Favorites from './pages/Favorites';
import Transactions from './pages/Transactions';
import Orders from './pages/Orders';
import Notifications from './pages/Notifications';
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
import { fetchOrders, fetchProducts, checkUserStatus } from './services/api';
import { useUser } from './context/UserContext';
import { formatRelativeTime, formatDate } from './utils/dateFormatter';
import MaintenancePage from './pages/MaintenancePage';
import Verification from './pages/Verification';

// Helper function for relative time
// Moved to utils/dateFormatter.js

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
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('signin');
  const [loginMessage, setLoginMessage] = useState('');
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // Check maintenance mode from backend
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const checkMaintenance = async () => {
      try {
        const res = await fetch(`${API_BASE}/get_products.php?limit=1`);
        if (res.status === 503) {
          const data = await res.json();
          setIsMaintenanceMode(data.maintenance === true);
        } else {
          setIsMaintenanceMode(false);
        }
      } catch {}
    };
    checkMaintenance();
    const intervalId = setInterval(checkMaintenance, 60000); // re-check every minute
    return () => clearInterval(intervalId);
  }, []);

  // Must be before any conditional returns to satisfy Rules of Hooks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('social_error') || params.get('social_token')) {
       setAuthInitialMode('signin');
       setIsLoginOpen(true);
    }
  }, []);

  // Move maintenance check AFTER hooks
  // if (isMaintenanceMode) return <MaintenancePage />;


  const openAuth = (mode = 'signin') => {
    setAuthInitialMode(mode);
    setIsLoginOpen(true);
  };
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
  const { addNotification, notifications, deleteNotification } = useNotifications();
  const { user, logout } = useUser();
  const maintenanceRef = useRef(isMaintenanceMode);

  useEffect(() => {
    maintenanceRef.current = isMaintenanceMode;
  }, [isMaintenanceMode]);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const productsRef = useRef(products);

  useEffect(() => {
      productsRef.current = products;
  }, [products]);

  const loadProducts = async () => {
    try {
      // Use ref to check current state to avoid stale closures in interval
      if (productsRef.current.length === 0) setLoading(true);
      
      const data = await fetchProducts();
      if (data && Array.isArray(data)) {
          const API_BASE = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL + '/' : 'http://localhost:8000/';
          
          const formatURL = (url) => {
              if (!url) return null;
              if (url.startsWith('http') || url.startsWith('data:')) return url;
              // Ensure it doesn't double slash
              return `${API_BASE}${url.startsWith('/') ? url.slice(1) : url}`;
          };

          const mappedProducts = data.map(p => ({
              ...p,
              image: formatURL(p.image_url || p.image),
              gallery: (Array.isArray(p.gallery) ? p.gallery : []).map(img => formatURL(img)),
              directions: formatURL(p.directions),
              price: parseFloat(p.price) || 0,
              rating: parseFloat(p.rating) || 0
          }));
          
          // Only update state if data has actually changed
          setProducts(prevProducts => {
            const isDifferent = JSON.stringify(prevProducts) !== JSON.stringify(mappedProducts);
            return isDifferent ? mappedProducts : prevProducts;
          });
          
          if (data.length === 0 && productsRef.current.length === 0) {
             addNotification("Product catalog is currently empty", "info");
          }
      } else {
          throw new Error("Invalid data format from server");
      }
    } catch (error) {
      if (error.maintenance) {
        setIsMaintenanceMode(true);
        return; // Silently fail and let the maintenance page handle it
      }
      
      // Only show error notification if we don't have products locally
      if (productsRef.current.length === 0) {
        // Suppress notification if maintenance mode is already known via Ref
        if (!maintenanceRef.current) {
            addNotification(`API Error: ${error.message}`, "error");
        }
      }
    } finally {
      if (productsRef.current.length === 0) setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(); // Initial load

    // Poll every 5 seconds
    const intervalId = setInterval(loadProducts, 5000);

    // Refresh on window focus
    const handleFocus = () => {
        loadProducts();
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
        clearInterval(intervalId);
        window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Sync selectedProduct with the latest products data from polling
  useEffect(() => {
    if (selectedProduct) {
      const latest = products.find(p => p.id === selectedProduct.id);
      if (latest && JSON.stringify(latest) !== JSON.stringify(selectedProduct)) {
        setSelectedProduct(latest);
      }
    }
  }, [products, selectedProduct]);

  // Periodic status check for suspension
  useEffect(() => {
    let interval;
    if (user) {
        interval = setInterval(async () => {
            const result = await checkUserStatus();
            if (result.maintenance) {
                setIsMaintenanceMode(true);
                return;
            }
            if (result.unauthorized) {
                logout();
                addNotification("Session expired. Please login again.", "info");
                return;
            }
            if (result.success && result.status === 'Suspended') {
                logout();
                alert("Your account has been suspended by an administrator. You will be logged out now.");
                addNotification("Account Suspended", "error");
            }
        }, 10000); // Check every 10 seconds
    }
    return () => clearInterval(interval);
  }, [user, logout]);

  useEffect(() => {
    if (user && activeDrawer === 'orders') {
        const loadOrders = async () => {
            try {
                const data = await fetchOrders(user.id);
                setOrders(data);
            } catch (error) {
                // Ignore silent error
            }
        };
        loadOrders();
    }
  }, [user, activeDrawer]);

  const closeDrawers = () => setActiveDrawer(null);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Route Protection Logic
  useEffect(() => {
    const protectedRoutes = ['/settings', '/transactions', '/profile', '/orders', '/notifications'];
    if (protectedRoutes.includes(location.pathname) && !user) {
       // Save the attempted path
       setRedirectPath(location.pathname);
       setLoginMessage('Please login to access this page');
       
       navigate('/');
       openAuth('signin');
       addNotification('Please login to access this page', 'info');
    }
  }, [location.pathname, user, navigate]);

  const handleAddToCart = (product, qty, color) => {
    if (!user) {
        setLoginMessage('Please login to add items to cart');
        openAuth('signin');
        addNotification('Please login to add items to cart', 'info');
        return;
    }
    addToCart(product, qty, color);
    addNotification(`Added ${product.name} to cart`, 'info');
  };

  const handleAddToWishlist = (product) => {
    if (!user) {
        setLoginMessage('Please login to manage your wishlist');
        openAuth('signin');
        addNotification('Please login to use wishlist', 'info');
        return;
    }
    toggleWishlist(product);
    const isNowIn = !isInWishlist(product.id);
    addNotification(
      isNowIn ? `Added ${product.name} to wishlist` : `Removed ${product.name} from wishlist`, 
      'info'
    );
  };

  if (isMaintenanceMode) return <MaintenancePage />;

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
          onLoginClick={() => openAuth('signin')} 
          onMapClick={() => setActiveDrawer('map')}
          onMenuClick={toggleSidebar}
          onThemeToggle={toggleDarkMode}
          onProductClick={setSelectedProduct}
          isDarkMode={isDarkMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          products={products}
        />

        <ScrollToTop />

        <main className="dashboard-grid full-width">
          <Routes>
            <Route path="/" element={<Home products={products} onProductClick={setSelectedProduct} searchQuery={searchQuery} loading={loading} />} />
            <Route path="/shop" element={<Shop products={products} onProductClick={setSelectedProduct} searchQuery={searchQuery} loading={loading} />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/favorites" element={<Favorites onProductClick={setSelectedProduct} searchQuery={searchQuery} />} />
            <Route path="/transactions" element={<Transactions searchQuery={searchQuery} />} />
            <Route path="/orders" element={<Orders searchQuery={searchQuery} />} />
            <Route path="/notifications" element={<Notifications searchQuery={searchQuery} />} />
            <Route path="/support" element={<Support searchQuery={searchQuery} />} />
            <Route path="/settings" element={<Settings searchQuery={searchQuery} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/verify-id" element={<Verification />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/shipping-info" element={<ShippingInfo />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/faq" element={<FAQ />} />
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
        isOpen={isLoginOpen} 
        initialMode={authInitialMode}
        onClose={() => {
            setIsLoginOpen(false);
            setLoginMessage('');
            // If user just logged in and we have a redirect path
            if (user && redirectPath) {
                navigate(redirectPath);
                setRedirectPath(null);
            }
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
                    <div style={{ marginTop: '8px', fontWeight: 600 }}>${parseFloat(order.total_amount || 0).toFixed(2)}</div>
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
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <NotificationProvider>
        <SettingsProvider>
          <WishlistProvider>
            <CartProvider>
              <WalletProvider>
                <AppContent />
              </WalletProvider>
            </CartProvider>
          </WishlistProvider>
        </SettingsProvider>
      </NotificationProvider>
    </UserProvider>
  );
}
