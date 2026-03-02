import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Package, Plus, CheckCircle,
  RefreshCw, Clock, Trash2, X, ChevronDown, Globe,
  Filter
} from 'lucide-react';
import {
  fetchWarehouses, createWarehouse, deleteWarehouse,
  fetchDispatches, createDispatch, updateDispatchStatus,
  fetchProducts
} from '../../services/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b',  border: 'rgba(245,158,11,0.3)',  icon: Clock },
  delivered:   { label: 'Delivered',   bg: 'rgba(34,197,94,0.12)',   text: '#22c55e',  border: 'rgba(34,197,94,0.3)',   icon: CheckCircle },
  returned:    { label: 'Returned',    bg: 'rgba(239,68,68,0.12)',   text: '#ef4444',  border: 'rgba(239,68,68,0.3)',   icon: RefreshCw },
  undelivered: { label: 'Undelivered', bg: 'rgba(100,116,139,0.12)', text: '#64748b',  border: 'rgba(100,116,139,0.3)', icon: X },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800,
      background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`
    }}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function WarehouseManager() {
  const [warehouses, setWarehouses] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [filterStatus, setFilterStatus]       = useState('all');

  // Modals
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [wForm, setWForm] = useState({ name: '', branch_code: '', address: '', region: '' });
  const [dForm, setDForm] = useState({ warehouse_id: '', product_id: '', quantity: 1, notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const hq = Array.isArray(warehouses) ? warehouses.find(w => w.type === 'headquarters') : null;
  const warehouseList = Array.isArray(warehouses) ? warehouses.filter(w => w.type === 'warehouse') : [];


  const load = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [wh, dp, pr] = await Promise.all([
        fetchWarehouses(),
        fetchDispatches(),
        fetchProducts()
      ]);
      setWarehouses(wh);
      setDispatches(dp);
      setProducts(pr);
    } catch (e) {
      console.error(e);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    const id = setInterval(() => load(false), 8000);
    return () => clearInterval(id);
  }, [load]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddWarehouse = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await createWarehouse(wForm);
      if (res.success) {
        setShowAddWarehouse(false);
        setWForm({ name: '', branch_code: '', address: '', region: '' });
        await load(false);
      } else {
        setError(res.message || 'Failed to add warehouse');
      }
    } catch { setError('Connection error'); }
    finally { setSaving(false); }
  };

  const handleDeleteWarehouse = async (id, name) => {
    if (!confirm(`Delete "${name}"? All dispatch records for this warehouse will also be removed.`)) return;
    try {
      const res = await deleteWarehouse(id);
      if (res.success) await load(false);
      else alert(res.message || 'Failed to delete warehouse');
    } catch { alert('Connection error'); }
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await createDispatch({
        warehouse_id: parseInt(dForm.warehouse_id),
        product_id:   parseInt(dForm.product_id),
        quantity:     parseInt(dForm.quantity),
        notes:        dForm.notes
      });
      if (res.success) {
        setShowDispatchForm(false);
        setDForm({ warehouse_id: '', product_id: '', quantity: 1, notes: '' });
        await load(false);
      } else {
        setError(res.message || 'Failed to create dispatch');
      }
    } catch { setError('Connection error'); }
    finally { setSaving(false); }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateDispatchStatus(id, status);
      setDispatches(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    } catch { alert('Failed to update status'); }
  };

  // ── Filtered dispatches ────────────────────────────────────────────────────

  const filtered = dispatches.filter(d => {
    const wMatch = filterWarehouse === 'all' || String(d.warehouse_id) === filterWarehouse;
    const sMatch = filterStatus === 'all' || d.status === filterStatus;
    return wMatch && sMatch;
  });

  const totalByStatus = (status) => dispatches.filter(d => d.status === status).length;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
      <MapPin size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
      <p>Loading warehouses...</p>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.5px' }}>Warehouse Management</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Track product dispatches from HQ to all warehouses.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => { setError(''); setShowDispatchForm(true); }}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px' }}>
            <Package size={15} /> New Dispatch
          </button>
          <button onClick={() => { setError(''); setShowAddWarehouse(true); }}
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px', background: 'var(--bg-surface-secondary)' }}>
            <Plus size={15} /> Add Warehouse
          </button>
        </div>
      </header>

      {/* Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Warehouses',  value: warehouseList.length, color: '#3b82f6', icon: <MapPin size={18}/> },
          { label: 'Pending',     value: totalByStatus('pending'),   color: '#f59e0b', icon: <Clock size={18}/> },
          { label: 'Delivered',   value: totalByStatus('delivered'), color: '#22c55e', icon: <CheckCircle size={18}/> },
          { label: 'Undelivered', value: totalByStatus('undelivered'), color: '#64748b', icon: <X size={18}/> },
          { label: 'Returned',    value: totalByStatus('returned'),  color: '#ef4444', icon: <RefreshCw size={18}/> },
        ].map((s, i) => (
          <div key={i} className="card glass" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ color: s.color, padding: '8px', borderRadius: '10px', background: `${s.color}18` }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 900 }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* HQ Card */}
      {hq && (
        <div className="card glass" style={{ border: '1px solid rgba(234,179,8,0.4)', background: 'rgba(234,179,8,0.04)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ padding: '12px', background: 'rgba(234,179,8,0.12)', borderRadius: '14px', border: '1px solid rgba(234,179,8,0.3)' }}>
              <Globe size={24} color="#eab308" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
                <span style={{ fontSize: '20px', fontWeight: 900 }}>{hq.name}</span>
                <span style={{ padding: '3px 10px', fontSize: '10px', fontWeight: 800, background: 'rgba(234,179,8,0.15)', color: '#eab308', borderRadius: '20px', border: '1px solid rgba(234,179,8,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Headquarters
                </span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {hq.address && <span><MapPin size={12} style={{ verticalAlign: 'middle', marginRight: 4 }}/>{hq.address}</span>}
                {hq.region && <span>📍 {hq.region}</span>}
                {hq.branch_code && <span>Code: <strong>{hq.branch_code}</strong></span>}
              </div>
            </div>
            <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '13px' }}>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#eab308' }}>{dispatches.length}</div>
              <div>Total Dispatches</div>
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Cards */}
      {warehouseList.length > 0 && (
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Warehouses</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {warehouseList.map(w => {
              const s = w.stats || {};
              return (
                <div key={w.id} className="card glass" style={{ padding: '20px', position: 'relative' }}>
                  <button onClick={() => handleDeleteWarehouse(w.id, w.name)}
                    style={{ position: 'absolute', top: '14px', right: '14px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.5 }}
                    title="Delete warehouse">
                    <Trash2 size={14} />
                  </button>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ padding: '10px', background: 'rgba(59,130,246,0.1)', borderRadius: '10px' }}>
                      <MapPin size={20} color="#3b82f6" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '15px' }}>{w.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{w.region} {w.branch_code && `• ${w.branch_code}`}</div>
                      {w.address && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{w.address}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', paddingTop: '14px', borderTop: '1px solid var(--border-light)' }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontWeight: 800, color: 'var(--primary-blue)' }}>{w.stats?.pending || 0}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending</div>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontWeight: 800, color: '#22c55e' }}>{w.stats?.delivered || 0}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delivered</div>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontWeight: 800, color: '#ef4444' }}>{w.stats?.returned || 0}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Returned</div>
                    </div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontWeight: 800, color: '#64748b' }}>{w.stats?.undelivered || 0}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Failed</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dispatch Table */}
      <div>
        {/* Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Dispatch Log</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select value={filterWarehouse} onChange={e => setFilterWarehouse(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', color: 'var(--text-main)', cursor: 'pointer' }}>
              <option value="all">All Warehouses</option>
              {warehouseList.map(w => <option key={w.id} value={String(w.id)}>{w.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', color: 'var(--text-main)', fontSize: '13px', fontWeight: 700 }}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="delivered">Delivered</option>
              <option value="undelivered">Undelivered</option>
              <option value="returned">Returned</option>
            </select>
          </div>
        </div>

        <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <Package size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>No dispatches found. Create your first dispatch to get started.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '14px 20px' }}>Product</th>
                  <th style={{ padding: '14px 20px' }}>Warehouse</th>
                  <th style={{ padding: '14px 20px' }}>Qty</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 20px' }}>Date</th>
                  <th style={{ padding: '14px 20px' }}>Notes</th>
                  <th style={{ padding: '14px 20px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700 }}>{d.product_name}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{d.warehouse_name}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 800 }}>{d.quantity}</td>
                    <td style={{ padding: '14px 20px' }}><StatusBadge status={d.status} /></td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {new Date(d.dispatched_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.notes || '—'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {d.status === 'pending' && (
                          <>
                            <button onClick={() => handleStatusUpdate(d.id, 'delivered')}
                              title="Mark as Delivered"
                              style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 700, borderRadius: '7px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={11} /> Confirm
                            </button>
                            <button onClick={() => handleStatusUpdate(d.id, 'undelivered')}
                              title="Mark as Undelivered"
                              style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 700, borderRadius: '7px', background: 'rgba(100,116,139,0.1)', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <X size={11} /> Fail
                            </button>
                          </>
                        )}
                        {d.status !== 'returned' && (
                          <button onClick={() => handleStatusUpdate(d.id, 'returned')}
                            title="Mark as Returned"
                            style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 700, borderRadius: '7px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <RefreshCw size={11} /> Return
                          </button>
                        )}
                        {d.status !== 'pending' && (
                          <button onClick={() => handleStatusUpdate(d.id, 'pending')}
                            title="Reset to Pending"
                            style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 700, borderRadius: '7px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} /> Pending
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Add Warehouse Modal ─────────────────────────────────────────────── */}
      {showAddWarehouse && (
        <div className="modal-backdrop active" onClick={() => setShowAddWarehouse(false)} style={{ zIndex: 100 }}>
          <div className="modal glass animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Add Warehouse</h2>
              <button onClick={() => setShowAddWarehouse(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={22}/></button>
            </div>
            {error && <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
            <form onSubmit={handleAddWarehouse} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Warehouse Name *</label>
                  <input className="input-field" required value={wForm.name} onChange={e => setWForm({...wForm, name: e.target.value})} placeholder="e.g. Kumasi Warehouse" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Code (Optional)</label>
                  <input className="input-field" value={wForm.branch_code} onChange={e => setWForm({...wForm, branch_code: e.target.value})} placeholder="e.g. KMS-01" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Region</label>
                  <input className="input-field" value={wForm.region} onChange={e => setWForm({...wForm, region: e.target.value})} placeholder="e.g. Ashanti" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Address</label>
                  <input className="input-field" value={wForm.address} onChange={e => setWForm({...wForm, address: e.target.value})} placeholder="Street / Town" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn" onClick={() => setShowAddWarehouse(false)} style={{ background: 'var(--bg-surface-secondary)' }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Warehouse'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Dispatch Modal ──────────────────────────────────────────────────── */}
      {showDispatchForm && (
        <div className="modal-backdrop active" onClick={() => setShowDispatchForm(false)} style={{ zIndex: 100 }}>
          <div className="modal glass animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 800 }}>New Dispatch</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>Send products from HQ → Warehouse</p>
              </div>
              <button onClick={() => setShowDispatchForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={22}/></button>
            </div>
            {error && <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
            <form onSubmit={handleDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Product *</label>
                <select required className="input-field" value={dForm.product_id} onChange={e => setDForm({...dForm, product_id: e.target.value})}
                  style={{ width: '100%', background: 'var(--bg-surface)' }}>
                  <option value="">Select a product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} {p.product_code ? `(${p.product_code})` : ''}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Destination Warehouse *</label>
                  <select required className="input-field" value={dForm.warehouse_id} onChange={e => setDForm({...dForm, warehouse_id: e.target.value})}
                    style={{ width: '100%', background: 'var(--bg-surface)' }}>
                    <option value="">Select warehouse...</option>
                    {warehouseList.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Quantity *</label>
                  <input required type="number" min="1" className="input-field" value={dForm.quantity}
                    onChange={e => setDForm({...dForm, quantity: e.target.value})} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Notes (Optional)</label>
                <textarea className="input-field" rows={2} value={dForm.notes}
                  onChange={e => setDForm({...dForm, notes: e.target.value})}
                  placeholder="e.g. Handle with care, fragile items..."
                  style={{ resize: 'none', width: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn" onClick={() => setShowDispatchForm(false)} style={{ background: 'var(--bg-surface-secondary)' }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={14} /> {saving ? 'Dispatching...' : 'Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
