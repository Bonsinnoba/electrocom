import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  RotateCcw, 
  Search, 
  Package, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ClipboardList,
  History,
  User,
  ShieldCheck
} from 'lucide-react';
import { fetchReturns, processReturn, fetchOrders } from '../services/api';

export default function ReturnManager() {
  const [returnHistory, setReturnHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [foundOrders, setFoundOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 1,
    reason: ''
  });
  const [searchParams] = useSearchParams();

  const user = JSON.parse(localStorage.getItem('ehub_user') || '{}');

  useEffect(() => {
    loadReturnHistory();
  }, []);

  const handleSearchOrder = useCallback(async (query) => {
    if (!query) return;
    
    setLoading(true);
    try {
      const orders = await fetchOrders();
      const filtered = orders.filter(o => 
        o.id.toLowerCase().includes(query.toLowerCase()) || 
        o.customer.toLowerCase().includes(query.toLowerCase())
      );
      setFoundOrders(filtered);
      
      // If exact match on order ID from search params, select it immediately
      const exactMatch = filtered.find(o => o.id.toLowerCase() === query.toLowerCase());
      if (exactMatch) {
        setSelectedOrder(exactMatch);
      }
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      setSearchQuery(orderId);
      handleSearchOrder(orderId);
    }
  }, [searchParams, handleSearchOrder]);

  const loadReturnHistory = async () => {
    setLoading(true);
    try {
      const res = await fetchReturns();
      if (res.success) {
        setReturnHistory(res.data);
      }
    } catch (err) {
      console.error("Failed to load returns", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSearch = (e) => {
    e.preventDefault();
    handleSearchOrder(searchQuery);
  };

  const handleProcessReturn = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !formData.product_id) return;

    setIsProcessing(true);
    try {
      const res = await processReturn({
        order_id: selectedOrder.id,
        ...formData
      });

      if (res.success) {
        alert("Return processed successfully. Stock has been updated.");
        setSelectedOrder(null);
        setFormData({ product_id: '', quantity: 1, reason: '' });
        setFoundOrders([]);
        setSearchQuery('');
        loadReturnHistory();
      } else {
        alert(res.error || "Failed to process return");
      }
    } catch (err) {
      alert("Connection error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <RotateCcw size={28} className="text-primary" />
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>Returns Management</h1>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Process customer returns and automatically restock items to inventory.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Column: Return History */}
        <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} /> Return History
            </h3>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>{returnHistory.length} Total</span>
          </div>
          
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {loading && returnHistory.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading history...</div>
            ) : returnHistory.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ClipboardList size={40} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                <p>No return records found.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 10 }}>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 24px' }}>Order / ID</th>
                    <th style={{ padding: '12px 24px' }}>Product</th>
                    <th style={{ padding: '12px 24px' }}>Qty</th>
                    <th style={{ padding: '12px 24px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {returnHistory.map((ret, idx) => (
                    <tr key={ret.id} style={{ borderBottom: '1px solid var(--border-light)', background: idx % 2 === 0 ? 'transparent' : 'rgba(var(--primary-blue-rgb), 0.02)' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{ret.order_display_id}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ret.customer_name}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 600 }}>{ret.product_name}</div>
                        <code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ret.product_code}</code>
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: 700 }}>{ret.quantity}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>
                        {new Date(ret.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Process New Return */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Step 1: Find Order */}
          <div className="card glass" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={18} /> 1. Find Order
            </h3>
            <form onSubmit={handleFormSearch} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Order ID (e.g. ORD-12) or Customer Name" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '0 20px' }}>Search</button>
            </form>

            {foundOrders.length > 0 && !selectedOrder && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {foundOrders.map(o => (
                  <button 
                    key={o.id} 
                    onClick={() => setSelectedOrder(o)}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      textAlign: 'left', 
                      background: 'var(--bg-surface-secondary)', 
                      border: '1px solid var(--border-light)', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{o.id}</div>
                      <div style={{ fontSize: '13px' }}>{o.customer}</div>
                    </div>
                    <ArrowRight size={16} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Process Return */}
          {selectedOrder && (
            <div className="card glass animate-fade-in" style={{ padding: '24px', border: '1px solid var(--primary-blue)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={18} /> 2. Process Return
                </h3>
                <button onClick={() => setSelectedOrder(null)} style={{ fontSize: '12px', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              </div>

              <div style={{ background: 'rgba(var(--primary-blue-rgb), 0.05)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <User size={16} className="text-primary" />
                  <span style={{ fontWeight: 600 }}>{selectedOrder.customer}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Order {selectedOrder.id} • {selectedOrder.date}</div>
              </div>

              <form onSubmit={handleProcessReturn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Select Item to Return</label>
                  <select 
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}
                    required
                  >
                    <option value="">-- Select Item --</option>
                    {selectedOrder.items.map((item, i) => (
                      <option key={i} value={item.product_id || item.id}>
                        {item.name} (Qty: {item.qty})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Return Qty</label>
                    <input 
                      type="number" 
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Reason</label>
                    <select 
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}
                      required
                    >
                      <option value="">-- Select Reason --</option>
                      <option value="Damaged">Damaged / Defective</option>
                      <option value="Wrong Item">Wrong Item Received</option>
                      <option value="Not as Described">Not as Described</option>
                      <option value="Customer Mind Changed">Customer Changed Mind</option>
                    </select>
                  </div>
                </div>

                <div style={{ padding: '16px', background: 'var(--success-bg)', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'start', marginTop: '8px' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--success)', marginTop: '2px' }} />
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--success)', fontWeight: 600, lineHeight: '1.4' }}>
                    Authorizing this return will automatically restock the item to its assigned shelf.
                  </p>
                </div>

                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="btn-primary" 
                  style={{ height: '48px', marginTop: '8px' }}
                >
                  {isProcessing ? 'Processing...' : 'Authorize Return & Restock'}
                </button>
              </form>
            </div>
          )}

          <div className="card glass" style={{ padding: '20px', borderLeft: '4px solid var(--warning)', background: 'rgba(245, 158, 11, 0.05)' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <AlertCircle size={20} style={{ color: 'var(--warning)', flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 800 }}>Manager Note</h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Items must be inspected for damage before being added back to active inventory. If an item is unsellable, please adjust stock levels in the <strong>Products</strong> module.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
