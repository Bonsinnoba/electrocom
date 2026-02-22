import React, { useState, useEffect } from 'react';
import { Eye, Truck, CheckCircle, Clock, X, MapPin, User, Package, Calendar } from 'lucide-react';
import { fetchOrders, updateOrderStatus } from '../services/api';

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
        const data = await fetchOrders();
        setOrders(data);
    } catch (error) {
        console.error("Failed to load orders", error);
    } finally {
        setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
        await updateOrderStatus(id, newStatus);
        loadOrders();
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
    } catch (error) {
        alert("Failed to update status");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header>
        <h1 style={{ fontSize: '32px', fontWeight: 800 }}>Orders</h1>
        <p style={{ color: 'var(--text-muted)' }}>Track and fulfill customer orders.</p>
      </header>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '8px' }}>
        <div className="card glass" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px' }}>
          <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', borderRadius: '10px' }}><Clock size={20} /></div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>In Review</div>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>12</div>
          </div>
        </div>
        <div className="card glass" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px' }}>
          <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderRadius: '10px' }}><Truck size={20} /></div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Active Shipments</div>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>8</div>
          </div>
        </div>
        <div className="card glass" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px' }}>
          <div style={{ padding: '10px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '10px' }}><CheckCircle size={20} /></div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Completed today</div>
            <div style={{ fontSize: '20px', fontWeight: 800 }}>24</div>
          </div>
        </div>
      </div>

      <div className="card glass" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '16px 24px' }}>Order ID</th>
              <th style={{ padding: '16px 24px' }}>Customer</th>
              <th style={{ padding: '16px 24px' }}>Date</th>
              <th style={{ padding: '16px 24px' }}>Amount</th>
              <th style={{ padding: '16px 24px' }}>Type</th>
              <th style={{ padding: '16px 24px' }}>Status</th>
              <th style={{ padding: '16px 24px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '14px' }}>
                <td style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--accent-blue)' }}>{o.id}</td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{o.customer}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{o.email}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{o.date}</td>
                <td style={{ padding: '16px 24px', fontWeight: 700 }}>${o.amount.toFixed(2)}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {o.type === 'Delivery' ? <Truck size={14} /> : <MapPin size={14} />} {o.type}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '100px', 
                    fontSize: '11px', 
                    fontWeight: 700,
                    background: o.status === 'Delivered' ? 'var(--success-bg)' : o.status === 'Shipped' ? 'var(--info-bg)' : 'var(--warning-bg)',
                    color: o.status === 'Delivered' ? 'var(--success)' : o.status === 'Shipped' ? 'var(--accent-blue)' : 'var(--warning)'
                  }}>
                    {o.status}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <button onClick={() => setSelectedOrder(o)} className="btn" style={{ padding: '6px 14px', fontSize: '12px', background: 'var(--bg-surface-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Eye size={14} /> Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '450px',
          height: '100%',
          zIndex: 2000,
          background: 'var(--bg-surface)',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--border-light)'
        }} className="glass">
          <header style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Order Details</h2>
              <span style={{ fontSize: '12px', color: 'var(--primary-blue)', fontWeight: 700 }}>{selectedOrder.id}</span>
            </div>
            <button onClick={() => setSelectedOrder(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </header>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <section>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} /> Customer Info
              </h3>
              <div className="card" style={{ background: 'var(--bg-surface-secondary)', border: 'none' }}>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{selectedOrder.customer}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{selectedOrder.email}</div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <MapPin size={16} style={{ flexShrink: 0 }} /> {selectedOrder.address}
                </div>
              </div>
            </section>

            <section>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={16} /> Order Items
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '10px', background: 'var(--bg-surface-secondary)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Qty: {item.qty}</div>
                    </div>
                    <div style={{ fontWeight: 800 }}>${(item.price * item.qty).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', padding: '16px', borderTop: '2px dashed var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>Total Amount</span>
                <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary-blue)' }}>${selectedOrder.amount.toFixed(2)}</span>
              </div>
            </section>

            <section>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} /> Fulfillment Status
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button 
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'Shipped')}
                  disabled={selectedOrder.status === 'Shipped'}
                  className="btn" 
                  style={{ background: 'var(--info-bg)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                >
                  <Truck size={14} /> Mark Shipped
                </button>
                <button 
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'Delivered')}
                  disabled={selectedOrder.status === 'Delivered'}
                  className="btn" 
                  style={{ background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                >
                  <CheckCircle size={14} /> Mark Delivered
                </button>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
