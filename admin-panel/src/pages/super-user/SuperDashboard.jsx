import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, Activity, Globe, ShieldCheck,
  AlertTriangle, RefreshCw, ArrowUpRight,
  Package, Users, ShoppingCart, Zap
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchSuperDashboard as getDashboard } from '../../services/api';

// ── Fix Leaflet default icon paths broken by Vite bundling ───────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Custom gold branch marker ─────────────────────────────────────────────────
function createBranchIcon(status = 'Online') {
  const colour = status === 'Online' ? '#22c55e' : status === 'Standby' ? '#f59e0b' : '#ef4444';
  return L.divIcon({
    className: '',
    iconSize:  [36, 36],
    iconAnchor:[18, 18],
    popupAnchor:[0, -20],
    html: `
      <div style="
        width:36px;height:36px;border-radius:50%;
        background:linear-gradient(135deg,#fbbf24,#f59e0b);
        border:3px solid ${colour};
        box-shadow:0 0 12px rgba(251,191,36,0.6), 0 0 0 4px rgba(251,191,36,0.15);
        display:flex;align-items:center;justify-content:center;
        font-size:16px;
      ">🏢</div>`,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt   = (n) => n >= 1_000_000 ? `GH₵ ${(n/1_000_000).toFixed(2)}M` : n >= 1000 ? `GH₵ ${(n/1000).toFixed(1)}k` : `GH₵ ${Number(n).toFixed(2)}`;
const fmtN  = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
const STATUS_COL = { pending:'#f59e0b', processing:'#3b82f6', shipped:'#a855f7', delivered:'#22c55e', cancelled:'#ef4444' };

// ── Skeleton card ─────────────────────────────────────────────────────────────
function Skeleton({ h = 24, w = '60%' }) {
  return <div style={{ height: h, width: w, borderRadius: 8, background: 'rgba(255,255,255,0.07)', animation: 'shimmer 1.4s infinite' }} />;
}

// ── Fixed branch nodes with GPS coords used as fallback ──────────────────────
const BRANCH_DEFAULTS = {
  'ACC-01': { lat: 5.6547,  lng: -0.1711, status: 'Online',  load: 82 },
  'KMS-01': { lat: 6.6885,  lng: -1.6244, status: 'Online',  load: 45 },
  'WA-01':  { lat: 10.0601, lng: -2.5099, status: 'Standby', load: 12 },
};

export default function Dashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = async () => {
    try {
      setError(null);
      const res = await getDashboard();
      setData(res);
      setLastUpdate(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Merge API branch data with default GPS coords as fallback
  const branches = (data?.branches || []).map(b => ({
    ...b,
    lat:    parseFloat(b.lat)  || BRANCH_DEFAULTS[b.branch_code]?.lat || 7.9465,
    lng:    parseFloat(b.lng)  || BRANCH_DEFAULTS[b.branch_code]?.lng || -1.0232,
    status: BRANCH_DEFAULTS[b.branch_code]?.status || 'Online',
    load:   BRANCH_DEFAULTS[b.branch_code]?.load   || 50,
  }));

  if (!loading && branches.length === 0) {
    Object.entries(BRANCH_DEFAULTS).forEach(([code, v]) => {
      branches.push({ branch_code: code, name: code, ...v });
    });
  }

  const stats = loading ? [] : [
    { label: 'Total Revenue',   value: fmt(data?.total_revenue  || 0), change: `${data?.total_orders || 0} orders`,  icon: <TrendingUp size={20} />, color: 'var(--primary-gold)' },
    { label: 'Active Branches', value: `${branches.filter(b=>b.status==='Online').length} / ${branches.length}`, change: 'Stable',        icon: <Activity size={20} />,   color: '#22c55e' },
    { label: 'Total Users',     value: fmtN(data?.total_users   || 0), change: `${data?.total_admins || 0} admins`,  icon: <Users size={20} />,      color: '#3b82f6' },
    { label: 'Products Listed', value: fmtN(data?.total_products|| 0), change: 'In catalogue',                       icon: <Package size={20} />,    color: '#a855f7' },
  ];

  return (
    <div className="animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-1px', marginBottom: '6px' }}>Global Performance</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Real-time data across all EssentialsHub branches.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <button onClick={load} disabled={loading} className="btn-primary" style={{ display:'flex', alignItems:'center', gap:'7px', padding:'10px 20px', fontSize:'13px' }}>
            <RefreshCw size={15} style={{ animation: loading ? 'spin 0.9s linear infinite' : 'none' }} />
            {loading ? 'Syncing…' : 'Refresh'}
          </button>
          {lastUpdate && <div style={{ fontSize:'11px', color:'var(--text-muted)', fontWeight:600 }}>Updated {lastUpdate.toLocaleTimeString()}</div>}
        </div>
      </header>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div style={{ marginBottom:'24px', padding:'14px 20px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'12px', display:'flex', gap:'12px', alignItems:'center' }}>
          <AlertTriangle size={18} color="#ef4444" />
          <div>
            <span style={{ fontWeight:800, color:'#ef4444' }}>API Error: </span>
            <span style={{ color:'var(--text-muted)', fontSize:'14px' }}>{error} — displaying cached/fallback data.</span>
          </div>
        </div>
      )}

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {loading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="card glass" style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                <Skeleton w="40px" h={40} />
                <Skeleton w="55%" />
                <Skeleton w="40%" h={32} />
              </div>
            ))
          : stats.map((stat, i) => (
              <div key={i} className="card glass" style={{ position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:'-10px', right:'-10px', width:'70px', height:'70px', background: stat.color, filter:'blur(50px)', opacity:0.18, pointerEvents:'none' }} />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:'16px' }}>
                  <div style={{ padding:'10px', borderRadius:'12px', background:'rgba(255,255,255,0.04)', color: stat.color }}>{stat.icon}</div>
                  <div style={{ fontSize:'12px', fontWeight:800, color: stat.color, display:'flex', alignItems:'center', gap:'4px' }}>
                    {stat.change} <ArrowUpRight size={13} />
                  </div>
                </div>
                <div style={{ color:'var(--text-muted)', fontSize:'13px', fontWeight:600, marginBottom:'6px' }}>{stat.label}</div>
                <div style={{ fontSize:'28px', fontWeight:900 }}>{stat.value}</div>
              </div>
            ))
        }
      </div>

      {/* ── Main content: Map + Node table ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>

        {/* ── Interactive Map ───────────────────────────────────────────────── */}
        <div className="card glass" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(251,191,36,0.2)' }}>
          {/* Map header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display:'flex', alignItems:'center', gap:'10px' }}>
            <Zap size={18} color="var(--primary-gold)" />
            <h2 style={{ fontSize:'18px', fontWeight:800 }}>Branch Location Map</h2>
            <div style={{ marginLeft:'auto', display:'flex', gap:'12px', fontSize:'11px', fontWeight:700 }}>
              {[['Online','#22c55e'],['Standby','#f59e0b'],['Offline','#ef4444']].map(([s,c]) => (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:'5px', color:'var(--text-muted)' }}>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:c }} />{s}
                </div>
              ))}
            </div>
          </div>

          {/* Leaflet Map */}
          <div style={{ height: '380px', position: 'relative' }}>
            <MapContainer
              center={[7.9465, -1.0232]}
              zoom={6}
              style={{ height: '100%', width: '100%', background: '#0f172a' }}
              zoomControl={true}
              attributionControl={false}
            >
              {/* Dark-style tile layer using CartoDB dark matter */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com">CartoDB</a>'
              />

              {/* Branch markers */}
              {branches.map((branch) => (
                <React.Fragment key={branch.id || branch.branch_code}>
                  {/* Pulsing circle behind marker */}
                  <Circle
                    center={[branch.lat, branch.lng]}
                    radius={25000}
                    pathOptions={{
                      color:   branch.status === 'Online' ? '#22c55e' : '#f59e0b',
                      fillColor: branch.status === 'Online' ? '#22c55e' : '#f59e0b',
                      fillOpacity: 0.08,
                      weight: 1.5,
                    }}
                  />
                  <Marker
                    position={[branch.lat, branch.lng]}
                    icon={createBranchIcon(branch.status)}
                  >
                    <Popup>
                      <div style={{ fontFamily:'Outfit, sans-serif', minWidth:'190px', background:'#0f172a', color:'#fff', borderRadius:'10px', padding:'14px', border:'1px solid rgba(251,191,36,0.3)' }}>
                        <div style={{ fontWeight:900, fontSize:'15px', marginBottom:'4px', color:'#fbbf24' }}>{branch.name}</div>
                        <div style={{ fontSize:'12px', color:'#94a3b8', marginBottom:'10px' }}>{branch.address || branch.branch_code}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', fontWeight:800 }}>
                          <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: branch.status==='Online' ? '#22c55e' : '#f59e0b' }} />
                          {branch.status} · {branch.load}% Load
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* ── Node Table ───────────────────────────────────────────────────── */}
        <div className="card glass">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
            <h2 style={{ fontSize:'18px', fontWeight:800 }}>Node Distribution</h2>
            <span style={{ fontSize:'12px', color:'var(--text-muted)', fontWeight:700 }}>{branches.length} nodes</span>
          </div>

          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              {[...Array(3)].map((_,i) => <Skeleton key={i} h={60} w="100%" />)}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {branches.map((b, i) => {
                const loadPct  = b.load;
                const loadCol  = loadPct > 80 ? '#ef4444' : loadPct > 60 ? '#f59e0b' : '#22c55e';
                const statusCol= b.status === 'Online' ? '#22c55e' : b.status === 'Standby' ? '#f59e0b' : '#ef4444';
                return (
                  <div key={b.id || i} style={{ padding:'16px', background:'rgba(0,0,0,0.15)', borderRadius:'12px', border:'1px solid var(--border-light)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                      <div>
                        <div style={{ fontWeight:800, fontSize:'14px' }}>{b.name}</div>
                        <div style={{ fontSize:'11px', color:'var(--primary-gold)', fontWeight:700, marginTop:'2px' }}>{b.branch_code}</div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'4px 10px', borderRadius:'20px', background:`rgba(${statusCol==='#22c55e'?'34,197,94':statusCol==='#f59e0b'?'245,158,11':'239,68,68'},0.12)`, border:`1px solid ${statusCol}44` }}>
                        <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:statusCol, animation: b.status==='Online'?'pulseGreen 2s infinite':'none' }} />
                        <span style={{ fontSize:'12px', fontWeight:800, color:statusCol }}>{b.status}</span>
                      </div>
                    </div>
                    {/* Load bar */}
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ flex:1, height:'5px', background:'rgba(255,255,255,0.07)', borderRadius:'3px', overflow:'hidden' }}>
                        <div style={{ width:`${loadPct}%`, height:'100%', background:loadCol, borderRadius:'3px', transition:'width 1s ease' }} />
                      </div>
                      <span style={{ fontSize:'11px', fontWeight:800, color:loadCol, width:'36px', textAlign:'right' }}>{loadPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Orders-by-status mini chart */}
          {!loading && data?.orders_by_status && (
            <div style={{ marginTop:'20px', paddingTop:'20px', borderTop:'1px solid var(--border-light)' }}>
              <div style={{ fontSize:'13px', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'12px' }}>Orders by Status</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {Object.entries(data.orders_by_status).map(([status, count]) => {
                  const total = data.total_orders || 1;
                  const pct   = Math.round((count / total) * 100);
                  const col   = STATUS_COL[status] || '#94a3b8';
                  return (
                    <div key={status} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'80px', fontSize:'11px', fontWeight:700, color:'var(--text-muted)', textTransform:'capitalize' }}>{status}</div>
                      <div style={{ flex:1, height:'6px', background:'rgba(255,255,255,0.06)', borderRadius:'3px', overflow:'hidden' }}>
                        <div style={{ width:`${pct}%`, height:'100%', background:col, borderRadius:'3px' }} />
                      </div>
                      <div style={{ width:'24px', fontSize:'11px', fontWeight:900, color:col, textAlign:'right' }}>{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Orders ──────────────────────────────────────────────────── */}
      <div className="card glass">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <h2 style={{ fontSize:'18px', fontWeight:800, display:'flex', alignItems:'center', gap:'10px' }}>
            <ShoppingCart size={18} color="var(--primary-gold)" /> Recent Orders
          </h2>
          <span style={{ fontSize:'12px', color:'var(--text-muted)', fontWeight:700 }}>Last 5 transactions</span>
        </div>
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {[...Array(5)].map((_,i) => <Skeleton key={i} h={48} w="100%" />)}
          </div>
        ) : !data?.recent_orders?.length ? (
          <div style={{ textAlign:'center', padding:'32px', color:'var(--text-muted)' }}>No orders yet.</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border-light)' }}>
                {['Order ID','Customer','Amount','Status','Date'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recent_orders.map((o, i) => {
                const col = STATUS_COL[o.status] || '#94a3b8';
                return (
                  <tr key={o.id || i} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding:'14px 16px', fontWeight:800, color:'var(--primary-gold)', fontSize:'13px' }}>ORD-{o.id}</td>
                    <td style={{ padding:'14px 16px' }}>
                      <div style={{ fontWeight:700, fontSize:'13px' }}>{o.customer}</div>
                      <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>{o.email}</div>
                    </td>
                    <td style={{ padding:'14px 16px', fontWeight:900, fontSize:'14px' }}>GH₵ {parseFloat(o.total_amount).toFixed(2)}</td>
                    <td style={{ padding:'14px 16px' }}>
                      <span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:800, background:`${col}18`, border:`1px solid ${col}44`, color:col, textTransform:'capitalize' }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding:'14px 16px', fontSize:'12px', color:'var(--text-muted)', fontWeight:600 }}>{fmtDate(o.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0%   { opacity: 0.5; }
          50%  { opacity: 1;   }
          100% { opacity: 0.5; }
        }
        @keyframes pulseGreen {
          0%,100% { opacity:1; }
          50%      { opacity:0.3; }
        }
        /* Dark Leaflet overrides */
        .leaflet-container { background: #020617 !important; }
        .leaflet-popup-content-wrapper {
          background: #0f172a !important;
          border: 1px solid rgba(251,191,36,0.3) !important;
          border-radius: 12px !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip { background: #0f172a !important; }
        .leaflet-popup-close-button { color: #94a3b8 !important; top:10px !important; right:10px !important; font-size:16px !important; }
        .leaflet-control-zoom a {
          background: #0f172a !important;
          color: #fbbf24 !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-zoom a:hover { background: #1e293b !important; }
      `}</style>
    </div>
  );
}
