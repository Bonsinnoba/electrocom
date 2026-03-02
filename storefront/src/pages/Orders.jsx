import React, { useEffect, useState } from 'react';
import { Package, Truck, CheckCircle, Clock, ExternalLink, Calendar, Hash, MapPin, Loader } from 'lucide-react';
import { formatDateTime } from '../utils/dateFormatter';
import { useUser } from '../context/UserContext';
import { fetchOrders } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import OrderTrackingModal from '../components/OrderTrackingModal';

const StatusIcon = ({ status }) => {
  switch(status?.toLowerCase()) {
    case 'completed': 
    case 'delivered': return <CheckCircle size={16} color="var(--success)" />;
    case 'shipped': return <Truck size={16} color="var(--primary-blue)" />;
    case 'pending': 
    case 'processing': return <Clock size={16} color="var(--warning)" />;
    default: return <Package size={16} />;
  }
};

const StatusBadge = ({ status }) => {
  const s = status ? status.toLowerCase() : 'unknown';
  
  const colors = {
    'completed': { bg: 'var(--success-bg)', text: 'var(--success)', border: 'var(--success)', label: 'Delivered' },
    'delivered': { bg: 'var(--success-bg)', text: 'var(--success)', border: 'var(--success)', label: 'Delivered' },
    'shipped': { bg: 'var(--info-bg)', text: 'var(--primary-blue)', border: 'var(--primary-blue)', label: 'Shipped' },
    'pending': { bg: 'var(--warning-bg)', text: 'var(--warning)', border: 'var(--warning)', label: 'Processing' },
    'processing': { bg: 'var(--warning-bg)', text: 'var(--warning)', border: 'var(--warning)', label: 'Processing' },
  };
  const style = colors[s] || { bg: 'var(--bg-surface-secondary)', text: 'var(--text-muted)', border: 'transparent', label: status };
  
  return (
    <span style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '6px', 
      padding: '6px 14px', 
      borderRadius: '20px', 
      fontSize: '11px', 
      fontWeight: 800, 
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      background: style.bg, 
      color: style.text,
      border: `1px solid ${style.bg === 'var(--bg-surface-secondary)' ? 'transparent' : style.text}`
    }} className="status-badge-container">
      <StatusIcon status={style.label} />
      {style.label}
    </span>
  );
};

export default function Orders({ searchQuery }) {
  const { user } = useUser();
  const { formatPrice } = useSettings();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  const openTracking = (id) => {
    setTrackingOrderId(id);
    setIsTrackingOpen(true);
  };

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) {
          setLoading(false);
          return;
      }
      try {
        const data = await fetchOrders(user.id);
        setOrders(data);
      } catch (error) {
        console.error("Failed to load orders", error);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [user]);

  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'delivered');
  const pastOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered');

  const OrderCard = ({ order }) => {
    // Using shared utility for consistent date formatting
    const displayDate = (dateString) => formatDateTime(dateString, { dateStyle: 'medium', timeStyle: 'short' });

    return (
    <div className="order-item-card glass" style={{ 
      padding: '28px', 
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <div style={{ background: 'var(--info-bg)', padding: '10px', borderRadius: '12px', color: 'var(--primary-blue)' }}>
            <Package size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px' }}>#{order.id}</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '14px', marginTop: '2px' }}>
              <Calendar size={14} /> {displayDate(order.created_at)}
            </div>
          </div>
        </div>
        
        <div style={{ paddingLeft: '46px' }}>
          <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '15px', marginBottom: '8px' }}>
            {order.items ? order.items : `Order #${order.id}`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '14px' }}>Total Amount:</span> {formatPrice(parseFloat(order.total_amount || 0))}
            </div>
            {order.status !== 'completed' && order.status !== 'delivered' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-blue)', fontSize: '13px', fontWeight: 600 }}>
                <MapPin size={14} /> Tracking Available
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px', minWidth: '150px' }}>
        <StatusBadge status={order.status} />
        <button 
          onClick={() => openTracking(order.id)}
          className="btn-secondary" 
          style={{ 
            fontSize: '13px', 
            fontWeight: 700,
            padding: '10px 20px', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            width: '100%',
            justifyContent: 'center'
          }}
        >
          Track Order <ExternalLink size={14} />
        </button>
      </div>

      <div className="card-hover-bg" style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '4px', 
        height: '100%', 
        background: 'var(--primary-blue)', 
        opacity: 0, 
        transition: 'opacity 0.3s' 
      }}></div>
    </div>
    );
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}><Loader className="animate-spin" /> Loading orders...</div>;
  if (!user) return <div style={{ padding: '40px', textAlign: 'center' }}>Please log in to view orders.</div>;

  return (
    <div className="orders-page" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '40px', 
      padding: '0 16px 48px',
      width: '100%'
    }}>
      <div className="page-header" style={{ padding: '24px 0 8px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px' }}>Orders</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginTop: '4px' }}>Track shipment progress and view your past purchase history.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Active Orders Section */}
        {activeOrders.length > 0 && (
          <div className="orders-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary-blue)', boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }}></div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Active Shipments</h2>
              <span style={{ padding: '2px 10px', background: 'var(--info-bg)', color: 'var(--primary-blue)', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>{activeOrders.length}</span>
            </div>
            <div className="orders-list-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr', 
              gap: '24px' 
            }}>
              {activeOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          </div>
        )}

        {/* Order History Section */}
        <div className="orders-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--text-muted)', opacity: 0.5 }}></div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Purchase History</h2>
          </div>
          {pastOrders.length === 0 && activeOrders.length === 0 ? (
             <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center', background: 'var(--bg-main)', borderRadius: '16px' }}>No orders found</div>
          ) : (
            <div className="orders-list-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr', 
                gap: '24px' 
            }}>
                {pastOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          )}
        </div>
      </div>

      <OrderTrackingModal 
        isOpen={isTrackingOpen}
        orderId={trackingOrderId}
        onClose={() => setIsTrackingOpen(false)}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 1024px) {
          .orders-list-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        .order-item-card:hover {
          transform: translateY(-4px);
          border-color: var(--primary-blue) !important;
          box-shadow: 0 12px 30px rgba(0,0,0,0.1);
        }
        .order-item-card:hover .card-hover-bg {
          opacity: 1 !important;
        }
        .status-badge-container {
           border-color: transparent !important;
        }
      `}} />
    </div>
  );
}
