import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, Activity, Globe, ShieldCheck,
  AlertTriangle, RefreshCw, ArrowUpRight,
  Package, Users, ShoppingCart, Zap, Server, Database,
  HardDrive, Cpu, FileText, Github, Chrome, Mail
} from 'lucide-react';
import { fetchSuperDashboard as getDashboard, fetchAnalytics } from '../../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';



// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt   = (n) => n >= 1_000_000 ? `GH₵ ${(n/1_000_000).toFixed(2)}M` : n >= 1000 ? `GH₵ ${(n/1000).toFixed(1)}k` : `GH₵ ${Number(n).toFixed(2)}`;
const fmtN  = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
const STATUS_COL = { pending:'#f59e0b', processing:'#3b82f6', shipped:'#a855f7', delivered:'#22c55e', cancelled:'#ef4444' };

// ── Skeleton card ─────────────────────────────────────────────────────────────
function Skeleton({ h = 24, w = '60%' }) {
  return <div style={{ height: h, width: w, borderRadius: 8, background: 'rgba(255,255,255,0.07)', animation: 'shimmer 1.4s infinite' }} />;
}



export default function Dashboard() {
  const [data, setData]     = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = async () => {
    try {
      setError(null);
      const [res, analyticsRes] = await Promise.all([
         getDashboard(),
         fetchAnalytics().catch(e => ({ success: false })) // Don't fail the whole dashboard if analytics fails
      ]);
      setData(res);
      if (analyticsRes.success) {
          setAnalytics(analyticsRes.data);
      }
      setLastUpdate(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);



  const stats = loading ? [] : [
    { label: 'Total Revenue',   value: fmt(data?.total_revenue  || 0), change: `${data?.total_orders || 0} orders`,  icon: <TrendingUp size={20} />, color: 'var(--primary-gold)' },
    { label: 'Total Users',     value: fmtN(data?.total_users   || 0), change: `${data?.total_admins || 0} admins`,  icon: <Users size={20} />,      color: '#3b82f6' },
    { label: 'Products Listed', value: fmtN(data?.total_products|| 0), change: 'In catalogue',                       icon: <Package size={20} />,    color: '#a855f7' },
  ];

  return (
    <div className="animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-1px', marginBottom: '6px' }}>Global Performance</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Real-time global performance data.</p>
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



      {/* ── Advanced Analytics (Recharts) ─────────────────────────────────── */}
      {!loading && analytics && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize:'20px', fontWeight:800, marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px' }}>
            <Activity size={20} color="var(--primary-blue)" /> Advanced Sales Analytics
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px' }}>
            
            {/* Revenue Area Chart */}
            <div className="card glass">
              <h3 style={{ fontSize:'15px', fontWeight:700, marginBottom:'16px', color:'var(--text-muted)' }}>Revenue (Last 30 Days)</h3>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer>
                  <AreaChart data={analytics.revenue_chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                       dataKey="date" 
                       tickFormatter={(str) => {
                          const date = new Date(str);
                          return `${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' })}`;
                       }}
                       stroke="#64748b" 
                       fontSize={12} 
                       tickLine={false} 
                       axisLine={false} 
                    />
                    <YAxis 
                       tickFormatter={(num) => `GH₵${num >= 1000 ? (num/1000).toFixed(0)+'k' : num}`} 
                       stroke="#64748b" 
                       fontSize={12} 
                       tickLine={false} 
                       axisLine={false} 
                    />
                    <RechartsTooltip 
                       contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                       formatter={(value) => [`GH₵ ${parseFloat(value).toFixed(2)}`, 'Revenue']}
                       labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Area type="monotone" dataKey="daily_revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products Bar Chart */}
            <div className="card glass">
              <h3 style={{ fontSize:'15px', fontWeight:700, marginBottom:'16px', color:'var(--text-muted)' }}>Top Selling Products</h3>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart data={analytics.top_products} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                       type="category" 
                       dataKey="name" 
                       width={100}
                       stroke="#64748b" 
                       fontSize={11} 
                       tickLine={false} 
                       axisLine={false}
                       tickFormatter={(str) => str.length > 15 ? str.substring(0, 15) + '...' : str}
                    />
                    <RechartsTooltip 
                       cursor={{fill: 'rgba(255,255,255,0.05)'}}
                       contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                       formatter={(value) => [`${value} units`, 'Sold']}
                    />
                    <Bar dataKey="total_sold" fill="var(--primary-gold)" radius={[0, 4, 4, 0]}>
                        {
                            (analytics.top_products || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? "var(--primary-gold)" : index === 1 ? "#3b82f6" : index === 2 ? "#a855f7" : "#64748b"} />
                            ))
                        }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

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

      {/* ── Monitoring Row: Auth Origins + Server Health ─────────────────────── */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>

          {/* Auth Origins */}
          <div className="card glass">
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
              <Globe size={18} color="#3b82f6" />
              <h2 style={{ fontSize:'18px', fontWeight:800 }}>Auth Origins</h2>
              <span style={{ marginLeft:'auto', fontSize:'12px', color:'var(--text-muted)', fontWeight:700 }}>How users sign in</span>
            </div>
            {data?.auth_origins?.length ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {data.auth_origins.map((o, i) => {
                  const COLORS = { local:'#3b82f6', google:'#ef4444', github:'#6366f1' };
                  const ICONS  = { local:<Mail size={14}/>, google:<Chrome size={14}/>, github:<Github size={14}/> };
                  const total  = data.auth_origins.reduce((s, r) => s + parseInt(r.count), 0) || 1;
                  const pct    = Math.round((parseInt(o.count) / total) * 100);
                  const col    = COLORS[o.provider] || '#64748b';
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:`${col}20`, border:`1px solid ${col}44`, display:'flex', alignItems:'center', justifyContent:'center', color:col, flexShrink:0 }}>
                        {ICONS[o.provider] || <Globe size={14}/>}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                          <span style={{ fontSize:'13px', fontWeight:700, textTransform:'capitalize' }}>{o.provider}</span>
                          <span style={{ fontSize:'12px', fontWeight:800, color:col }}>{o.count} ({pct}%)</span>
                        </div>
                        <div style={{ height:'5px', background:'rgba(255,255,255,0.06)', borderRadius:'3px', overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`, height:'100%', background:col, borderRadius:'3px', transition:'width 1s' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'32px', color:'var(--text-muted)' }}>No auth data yet.</div>
            )}
          </div>

          {/* Server Health */}
          <div className="card glass">
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
              <Server size={18} color="#22c55e" />
              <h2 style={{ fontSize:'18px', fontWeight:800 }}>Server Health</h2>
              <span style={{ marginLeft:'auto', fontSize:'11px', fontFamily:'monospace', color:'var(--text-muted)' }}>PHP {data?.server_health?.php_version}</span>
            </div>
            {data?.server_health && (() => {
              const h = data.server_health;
              const diskCol = h.disk_used_pct > 80 ? '#ef4444' : h.disk_used_pct > 60 ? '#f59e0b' : '#22c55e';
              return (
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', fontWeight:700, marginBottom:'6px' }}>
                      <span style={{ display:'flex', alignItems:'center', gap:'6px', color:'var(--text-muted)' }}><HardDrive size={13}/> Disk</span>
                      <span style={{ color:diskCol }}>{h.disk_used_gb} GB / {h.disk_total_gb} GB ({h.disk_used_pct}%)</span>
                    </div>
                    <div style={{ height:'7px', background:'rgba(255,255,255,0.06)', borderRadius:'4px', overflow:'hidden' }}>
                      <div style={{ width:`${h.disk_used_pct}%`, height:'100%', background:diskCol, borderRadius:'4px', transition:'width 1s' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', fontWeight:700, marginBottom:'6px' }}>
                      <span style={{ display:'flex', alignItems:'center', gap:'6px', color:'var(--text-muted)' }}><Cpu size={13}/> PHP Memory</span>
                      <span style={{ color:'#3b82f6' }}>{h.mem_used_mb} MB used · peak {h.mem_peak_mb} MB / {h.mem_limit}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:'12px', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px', display:'flex', alignItems:'center', gap:'6px' }}>
                      <Database size={12}/> Largest Tables
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                      {(h.db_tables || []).slice(0,5).map((t, i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', padding:'4px 8px', background:'rgba(255,255,255,0.03)', borderRadius:'6px' }}>
                          <span style={{ fontFamily:'monospace', color:'var(--text-muted)' }}>{t.name}</span>
                          <span style={{ fontWeight:700 }}>{t.size_kb} KB · {t.approx_rows} rows</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── PHP Error Log Viewer ─────────────────────────────────────────────── */}
      {!loading && (
        <div className="card glass" style={{ marginBottom: '32px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
            <FileText size={18} color="#f59e0b" />
            <h2 style={{ fontSize:'18px', fontWeight:800 }}>PHP Error Log</h2>
            <span style={{ marginLeft:'auto', fontSize:'12px', color:'var(--text-muted)', fontWeight:700 }}>Last 40 entries (newest first)</span>
          </div>
          {data?.error_log_tail?.length ? (
            <div style={{
              background:'rgba(0,0,0,0.35)',
              borderRadius:'10px',
              border:'1px solid rgba(255,255,255,0.06)',
              maxHeight:'300px',
              overflowY:'auto',
              padding:'14px 16px',
              fontFamily:'monospace',
              fontSize:'11.5px',
              lineHeight:'1.7',
            }}>
              {[...data.error_log_tail].reverse().map((line, i) => {
                const isError = /\[error\]|\[fatal\]|Fatal error/i.test(line);
                const isWarn  = /\[warn\]/i.test(line);
                return (
                  <div key={i} style={{ color: isError ? '#f87171' : isWarn ? '#fbbf24' : 'rgba(148,163,184,0.85)', borderBottom:'1px solid rgba(255,255,255,0.03)', paddingBottom:'2px', wordBreak:'break-all' }}>
                    {line}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'32px', color:'#22c55e', fontFamily:'monospace', fontSize:'13px' }}>
              ✓ No error log found or log is empty — your server is clean!
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0%   { opacity: 0.5; }
          50%  { opacity: 1;   }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
