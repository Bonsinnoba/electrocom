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

  return (
    <aside className={`sidebar ${isOpen ? 'active' : ''}`} id="sidebar">
      <div className="sidebar-close" onClick={onClose}>
        <X size={24} />
      </div>
      <div className="sidebar-nav">
        <div className="sidebar-top">
          <Link to="/" className={`sidebar-icon ${isActive('/') ? 'active' : ''}`} data-tooltip="Dashboard" data-tooltip-pos="right" onClick={onClose}>
            <LayoutGrid size={24} />
            <span className="sidebar-label">Dashboard</span>
          </Link>
          <Link 
            to="/cart"
            className={`sidebar-icon ${isActive('/cart') ? 'active' : ''}`} 
            data-tooltip="Cart" 
            data-tooltip-pos="right"
            onClick={onClose}
          >
            <ShoppingCart size={24} />
            <span className="sidebar-label">Cart</span>
          </Link>
          <div 
            className="sidebar-icon" 
            data-tooltip="Location" 
            data-tooltip-pos="right"
            onClick={() => { onMapClick(); onClose(); }}
          >
            <MapPin size={24} />
            <span className="sidebar-label">Location</span>
          </div>
          <Link to="/shop" className={`sidebar-icon ${isActive('/shop') ? 'active' : ''}`} data-tooltip="Shop" data-tooltip-pos="right" onClick={onClose}>
            <ShoppingBag size={24} />
            <span className="sidebar-label">Shop</span>
          </Link>
          <Link to="/favorites" className={`sidebar-icon ${isActive('/favorites') ? 'active' : ''} ${user && wishlistItems.length > 0 ? 'heart-active' : ''}`} data-tooltip="Favorites" data-tooltip-pos="right" style={{ position: 'relative' }} onClick={onClose}>
            <Heart size={24} />
            {user && wishlistItems.length > 0 && (
              <span className="favorites-badge"></span>
            )}
            <span className="sidebar-label">Favorites</span>
          </Link>
          <Link to="/transactions" className={`sidebar-icon ${isActive('/transactions') ? 'active' : ''}`} data-tooltip="Transactions" data-tooltip-pos="right" onClick={onClose}>
            <Receipt size={24} />
            <span className="sidebar-label">Transactions</span>
          </Link>
          <Link to="/orders" className={`sidebar-icon ${isActive('/orders') ? 'active' : ''}`} data-tooltip="Orders" data-tooltip-pos="right" onClick={onClose}>
            <Package size={24} />
            <span className="sidebar-label">Orders</span>
          </Link>
          <Link to="/notifications" className={`sidebar-icon ${isActive('/notifications') ? 'active' : ''}`} data-tooltip="Notifications" data-tooltip-pos="right" style={{ position: 'relative' }} onClick={onClose}>
            <Bell size={24} />
            {user && unreadCount > 0 && (
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
            <span className="sidebar-label">Notifications</span>
          </Link>
          <Link to="/support" className={`sidebar-icon ${isActive('/support') ? 'active' : ''}`} data-tooltip="Support" data-tooltip-pos="right" onClick={onClose}>
            <HelpCircle size={24} />
            <span className="sidebar-label">Support</span>
          </Link>
        </div>
      </div>

      <div className="sidebar-bottom">
        <Link to="/settings" className={`sidebar-icon ${isActive('/settings') ? 'active' : ''}`} data-tooltip="Settings" data-tooltip-pos="right" onClick={onClose}>
          <Settings size={24} />
          <span className="sidebar-label">Settings</span>
        </Link>
        {user ? (
          <>
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
            <div className="sidebar-icon" data-tooltip="Logout" data-tooltip-pos="right" onClick={handleLogout}>
              <LogOut size={24} color="var(--danger)" />
              <span className="sidebar-label" style={{ color: 'var(--danger)' }}>Logout</span>
            </div>
          </>
        ) : (
          <div className="sidebar-icon" data-tooltip="Login" data-tooltip-pos="right" onClick={() => { navigate('/'); onClose(); }}>
            <User size={24} />
            <span className="sidebar-label">Login</span>
          </div>
        )}
      </div>
    </aside>
  );
}
