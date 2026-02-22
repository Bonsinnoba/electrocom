import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, Map, ShoppingCart, Moon, Sun, X, Bell, ExternalLink, ArrowRight } from 'lucide-react';
import CategoryDropdown from './CategoryDropdown';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useUser } from '../context/UserContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar({ 
  onLoginClick, 
  onMapClick, 
  onMenuClick, 
  onThemeToggle, 
  onProductClick,
  isDarkMode,
  searchQuery,
  setSearchQuery,
  products = []
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { unreadCount } = useNotifications();
  const { user } = useUser();

  const pages = [
    { name: 'Shop All Products', path: '/shop', icon: '🛍️' },
    { name: 'My Orders & History', path: '/orders', icon: '📦' },
    { name: 'Transactions & Billing', path: '/transactions', icon: '🧾' },
    { name: 'My Favorites', path: '/favorites', icon: '❤️' },
    { name: 'Settings & Privacy', path: '/settings', icon: '⚙️' },
    { name: 'Customer Support', path: '/support', icon: '🎧' },
    { name: 'User Profile', path: '/profile', icon: '👤' },
  ];

  const results = React.useMemo(() => {
    if (!searchQuery.trim()) return { pages: [], products: [] };
    const q = searchQuery.toLowerCase();
    
    return {
      pages: pages.filter(p => p.name.toLowerCase().includes(q)),
      products: products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.product_code && p.product_code.toLowerCase().includes(q))
      ).slice(0, 5)
    };
  }, [searchQuery, products]);

  const hasResults = results.pages.length > 0 || results.products.length > 0;
  const showFilter = location.pathname === '/' || location.pathname === '/shop';
  
  const productPages = ['/', '/shop', '/favorites', '/cart', '/checkout', '/transactions', '/orders'];
  const isProductPage = productPages.includes(location.pathname);
  const searchPlaceholder = isProductPage ? "Search for products..." : "Search settings & notifications...";

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
        setIsFocused(false);
      }
    }

    if (isSearchOpen || isFocused) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen, isFocused]);

  return (
    <nav className="top-nav">
      <div className="sidebar-icon" id="toggle-menu" style={{ margin: 0 }} onClick={onMenuClick}>
        <Menu size={20} />
      </div>
      
      <Link to="/" style={{ display: 'flex' }}>
        <img src="/logo.png" className={`nav-logo ${isSearchOpen ? 'hidden-mobile' : ''}`} alt="EssentialsHub" />
      </Link>
      
      <div ref={searchRef} className={`search-container ${isSearchOpen ? 'active' : ''}`}>
        <Search className="search-icon" size={18} />
        <input 
          type="text" 
          id="search-input" 
          placeholder={searchPlaceholder} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          autoComplete="off"
        />
        {searchQuery && (
          <div 
            className="search-clear-btn" 
            onClick={() => setSearchQuery('')}
          >
            <X size={16} />
          </div>
        )}

        {/* Search Results Dropdown */}
        {isFocused && hasResults && (
          <div className="search-results-dropdown glass animate-fade-in">
            {results.pages.length > 0 && (
              <div className="results-section">
                <div className="section-label">Sections</div>
                {results.pages.map(page => (
                  <Link 
                    key={page.path} 
                    to={page.path} 
                    className="result-item"
                    onClick={() => {
                      setSearchQuery('');
                      setIsFocused(false);
                      setIsSearchOpen(false);
                    }}
                  >
                    <span className="result-icon">{page.icon}</span>
                    <div className="result-info">
                      <span className="result-name">{page.name}</span>
                      <span className="result-meta">Navigate to page</span>
                    </div>
                    <ArrowRight size={14} className="result-arrow" />
                  </Link>
                ))}
              </div>
            )}

            {results.products.length > 0 && (
              <div className="results-section">
                <div className="section-label">Products</div>
                {results.products.map(product => (
                  <div 
                    key={product.id} 
                    className="result-item"
                    onClick={() => {
                      if (onProductClick) {
                        onProductClick(product);
                      } else {
                        navigate('/shop');
                        setSearchQuery(product.name);
                      }
                      setIsFocused(false);
                      setIsSearchOpen(false);
                    }}
                  >
                    <img src={product.image} alt="" className="result-thumb" />
                    <div className="result-info">
                      <span className="result-name">{product.name}</span>
                      <span className="result-meta">${product.price} • View Details</span>
                    </div>
                    <ArrowRight size={14} className="result-arrow" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mobile-search-close" onClick={() => setIsSearchOpen(false)}>
          <X size={20} />
        </div>
      </div>

      {showFilter && <CategoryDropdown onSelect={(cat) => setSearchQuery(cat === 'All Categories' ? '' : cat)} />}

      <div className="nav-actions">
        {/* Mobile Search Toggle */}
        <div 
          className="sidebar-icon mobile-nav-icon" 
          onClick={() => setIsSearchOpen(!isSearchOpen)}
        >
          <Search size={20} />
        </div>
        
        {/* Mobile Map Toggle */}
        <div className="sidebar-icon" onClick={onMapClick}>
          <Map size={20} />
        </div>
        
        {/* Mobile Notifications Toggle */}
        <Link to="/notifications" className="sidebar-icon" style={{ position: 'relative' }}>
          <Bell size={20} />
          {user && unreadCount > 0 && (
            <span key={unreadCount} className="badge-premium badge-notif">
              {unreadCount}
            </span>
          )}
        </Link>
        
        {/* Mobile Cart Link */}
        <Link to="/cart" className="sidebar-icon" style={{ position: 'relative' }}>
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span key={cartCount} className="badge-premium badge-cart">
              {cartCount}
            </span>
          )}
        </Link>

        <div className="sidebar-icon" id="theme-toggle" onClick={onThemeToggle}>
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </div>
        
        {user ? (
          <Link 
            to="/profile" 
            className="profile-nav-link" 
            style={{ 
              background: 'var(--primary-blue)', 
              color: 'white', 
              borderRadius: '24px', 
              padding: '4px 16px 4px 4px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              textDecoration: 'none', 
              height: '42px', 
              width: 'auto',
              flexShrink: 0
            }}
          >
            <div style={{ 
              width: '34px', 
              height: '34px', 
              borderRadius: '50%', 
              background: user.profileImage ? 'transparent' : 'white', 
              color: 'var(--primary-blue)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 800, 
              fontSize: '13px',
              border: '2px solid white',
              flexShrink: 0,
              overflow: 'hidden'
            }}>
              {user.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                user.avatar || user.name?.charAt(0) || 'U'
              )}
            </div>
            <span className="navbar-user-name" style={{ fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {user.name?.split(' ')[0] || 'User'}
            </span>
          </Link>
        ) : (
          <button className="btn-login" id="btn-login" onClick={onLoginClick}>Login</button>
        )}
      </div>
    </nav>
  );
}