import { LayoutGrid, ShoppingBag, Heart, Receipt, Package, Bell, Settings, HelpCircle, User, MapPin, ShoppingCart, X, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useNotifications } from '../context/NotificationContext';
import { useUser } from '../context/UserContext';

export default function Sidebar({ isOpen, onClose, onOrdersClick, onNotificationsClick, onMapClick }) {
  const { user, logout } = useUser();
  const { wishlistItems } = useWishlist();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    onClose();
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { to: "/", icon: <LayoutGrid size={24} />, label: "Dashboard", tooltip: "Dashboard" },
    { to: "/cart", icon: <ShoppingCart size={24} />, label: "Cart", tooltip: "Cart" },
    { type: 'map', icon: <MapPin size={24} />, label: "Location", tooltip: "Location" },
    { to: "/shop", icon: <ShoppingBag size={24} />, label: "Shop", tooltip: "Shop" },
    { to: "/favorites", icon: <Heart size={24} />, label: "Favorites", tooltip: "Favorites", badge: user && wishlistItems.length > 0 },
    { to: "/transactions", icon: <Receipt size={24} />, label: "Transactions", tooltip: "Transactions" },
    { to: "/orders", icon: <Package size={24} />, label: "Orders", tooltip: "Orders" },
    { to: "/notifications", icon: <Bell size={24} />, label: "Notifications", tooltip: "Notifications", notificationDot: user && unreadCount > 0 },
    { to: "/support", icon: <HelpCircle size={24} />, label: "Support", tooltip: "Support" },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'active' : ''}`} id="sidebar">
      <div className="sidebar-close" onClick={onClose}>
        <X size={24} />
      </div>
      <div className="sidebar-nav">
        <div className="sidebar-top">
          {navItems.map((item, idx) => (
            <div 
              key={idx} 
              className={isOpen ? "animate-slide-in" : ""} 
              style={{ 
                animationDelay: `${idx * 0.05}s`,
                animationFillMode: 'both',
                display: 'block'
              }}
            >
              {item.type === 'map' ? (
                <div 
                  className="sidebar-icon" 
                  data-tooltip={item.tooltip} 
                  data-tooltip-pos="right"
                  onClick={() => { onMapClick(); onClose(); }}
                >
                  {item.icon}
                  <span className="sidebar-label">{item.label}</span>
                </div>
              ) : (
                <Link 
                  to={item.to} 
                  className={`sidebar-icon ${isActive(item.to) ? 'active' : ''} ${item.badge ? 'heart-active' : ''}`} 
                  data-tooltip={item.tooltip} 
                  data-tooltip-pos="right" 
                  style={{ position: 'relative' }}
                  onClick={onClose}
                >
                  {item.icon}
                  {item.badge && <span className="favorites-badge"></span>}
                  {item.notificationDot && (
                    <span style={{ 
                      position: 'absolute', 
                      top: '12px', 
                      right: '12px', 
                      background: 'var(--primary-blue)', 
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '50%',
                      border: '2px solid var(--bg-surface)'
                    }}></span>
                  )}
                  <span className="sidebar-label">{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-bottom">
        <div className={isOpen ? "animate-slide-in" : ""} style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
          <Link to="/settings" className={`sidebar-icon ${isActive('/settings') ? 'active' : ''}`} data-tooltip="Settings" data-tooltip-pos="right" onClick={onClose}>
            <Settings size={24} />
            <span className="sidebar-label">Settings</span>
          </Link>
        </div>
        
        {user ? (
          <>
            <div className={isOpen ? "animate-slide-in" : ""} style={{ animationDelay: '0.55s', animationFillMode: 'both' }}>
              <Link to="/profile" className={`sidebar-icon profile-link ${isActive('/profile') ? 'active' : ''}`} data-tooltip="Profile" data-tooltip-pos="right" style={{ padding: '4px' }} onClick={onClose}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  overflow: 'hidden',
                  border: '2px solid var(--primary-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-surface)'
                }}>
                  {user.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <span style={{ color: 'var(--primary-blue)', fontWeight: 700 }}>
                      {user.avatar || user.name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
              </Link>
            </div>
            <div className={isOpen ? "animate-slide-in" : ""} style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
              <div className="sidebar-icon" data-tooltip="Logout" data-tooltip-pos="right" onClick={handleLogout}>
                <LogOut size={24} color="var(--danger)" />
                <span className="sidebar-label" style={{ color: 'var(--danger)' }}>Logout</span>
              </div>
            </div>
          </>
        ) : (
          <div className={isOpen ? "animate-slide-in" : ""} style={{ animationDelay: '0.55s', animationFillMode: 'both' }}>
            <div className="sidebar-icon" data-tooltip="Login" data-tooltip-pos="right" onClick={() => { navigate('/'); onClose(); }}>
              <User size={24} />
              <span className="sidebar-label">Login</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
