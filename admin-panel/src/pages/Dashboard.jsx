import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Calendar, 
  Search, 
  Bell, 
  Clock, 
  Activity, 
  ExternalLink,
  Zap,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { fetchAnalytics } from '../services/api';
import { useAdminSettings } from '../context/AdminSettingsContext';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';

const StatCard = ({ icon, label, value, trend, trendLabel, color = 'var(--primary-blue)', loading }) => (
  <div className={`card glass animate-fade-in ${loading ? 'shimmer' : ''}`} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ 
        width: '48px', 
        height: '48px', 
        borderRadius: '12px', 
        background: `rgba(var(--accent-blue-rgb), 0.1)`, 
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </div>
      {trend && (
        <div style={{ 
          fontSize: '12px', 
          fontWeight: 700, 
          color: trend.startsWith('+') ? 'var(--success)' : 'var(--accent-blue)',
          background: trend.startsWith('+') ? 'var(--success-bg)' : 'var(--info-bg)',
          padding: '4px 8px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {trend} <ArrowUpRight size={12} />
        </div>
      )}
    </div>
    <div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '4px' }}>{loading ? '---' : value}</div>
      {trendLabel && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{trendLabel}</div>}
    </div>
  </div>
);

export default function Dashboard() {
  const { siteName } = useAdminSettings();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const loadAnalytics = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await fetchAnalytics();
      if (res.success) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics(true);
    const interval = setInterval(() => loadAnalytics(false), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="loading-state">
        <Activity className="animate-pulse" size={48} color="var(--primary-blue)" />
        <p>Synchronizing Analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card glass animate-fade-in" style={{ padding: '60px', textAlign: 'center', margin: '40px auto', maxWidth: '500px' }}>
        <AlertTriangle size={48} color="var(--danger)" style={{ marginBottom: '24px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Analytics Unavailable</h2>
        <p style={{ color: 'var(--text-muted)', margin: '16px 0' }}>{error}</p>
        <button className="btn btn-primary" onClick={() => loadAnalytics(true)}>Retry Connection</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-0.02em' }}>{siteName || 'Dashboard'}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600 }}>
            Real-time business performance overview.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
           <div className="glass" style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} className="text-success animate-pulse" /> LIVE FEED
           </div>
           <div className="glass" style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} /> MARCH 2026
           </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
        <StatCard 
          icon={<DollarSign size={24} />} 
          label="Total Revenue" 
          value={`GH₵ ${Number(data?.total_revenue || 0).toLocaleString()}`} 
          trend="+15.4%" 
          trendLabel="Combined Growth"
          color="var(--primary-blue)"
        />
        <StatCard 
          icon={<ShoppingBag size={24} />} 
          label="Online Sales" 
          value={`GH₵ ${Number(data?.revenue_online || 0).toLocaleString()}`} 
          trendLabel="Platform Revenue"
        />
        <StatCard 
          icon={<Zap size={24} />} 
          label="POS Sales" 
          value={`GH₵ ${Number(data?.revenue_pos || 0).toLocaleString()}`} 
          color="var(--accent-gold)"
          trendLabel="Store Revenue"
        />
        <StatCard 
          icon={<Layers size={24} />} 
          label="Total Orders" 
          value={String(data?.total_orders || 0)} 
          color="var(--primary-blue)"
          trendLabel="Completed Volume"
        />
        <StatCard 
          icon={<Activity size={24} />} 
          label="Avg Order" 
          value={`GH₵ ${Number(data?.avg_order_value || 0).toLocaleString()}`} 
          color="var(--info)"
          trendLabel="Per Transaction"
        />
        <StatCard 
          icon={<Users size={24} />} 
          label="Customers" 
          value={String(data?.total_customers || 0)} 
          color="var(--success)"
          trendLabel="Direct Reach"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        {/* Economic Velocity (Chart) */}
        <div className="card glass" style={{ gridColumn: 'span 2', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Economic Velocity</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Revenue trends across last 30 days</p>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontWeight: 700 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-blue)' }}></div> Online</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-gold)' }}></div> POS</div>
            </div>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue_chart}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-blue)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--primary-blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis hide />
                <RechartsTooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-main)' }} />
                <Area type="monotone" dataKey="online_revenue" stackId="1" stroke="var(--accent-blue)" strokeWidth={3} fill="url(#colorTotal)" />
                <Area type="monotone" dataKey="pos_revenue" stackId="1" stroke="var(--accent-gold)" strokeWidth={3} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strategic Insights */}
        <div className="card glass" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
           <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Strategic Insights</h3>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderLeft: '4px solid var(--primary-blue)', paddingLeft: '16px' }}>
                 <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fulfillment Efficiency</div>
                 <div style={{ fontSize: '20px', fontWeight: 900, marginTop: '4px' }}>{data?.strategic_insights?.ship_efficiency ?? '—'} Hours</div>
                 <div style={{ fontSize: '10px', color: 'var(--success)', marginTop: '4px' }}>Avg time to dispatch</div>
              </div>

              <div style={{ borderLeft: '4px solid var(--accent-gold)', paddingLeft: '16px' }}>
                 <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Revenue Peak</div>
                 <div style={{ fontSize: '20px', fontWeight: 900, marginTop: '4px' }}>GH₵ {Number(data?.strategic_insights?.revenue_peak || 0).toLocaleString()}</div>
                 <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Highest daily volume</div>
              </div>

              <div style={{ borderLeft: '4px solid var(--danger)', paddingLeft: '16px' }}>
                 <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Low Stock Alert</div>
                 <div style={{ fontSize: '20px', fontWeight: 900, marginTop: '4px' }}>{data?.low_stock_count ?? 0} Products</div>
                 <div style={{ fontSize: '10px', color: 'var(--danger)', marginTop: '4px' }}>Requires immediate restocking</div>
              </div>
           </div>

            <div className="glass" style={{ marginTop: 'auto', padding: '16px', borderRadius: '12px', background: 'rgba(var(--accent-blue-rgb), 0.05)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>
                 <TrendingUp size={16} color={(data?.strategic_insights?.health_score || 0) > 80 ? 'var(--success)' : (data?.strategic_insights?.health_score || 0) > 60 ? 'var(--accent-gold)' : 'var(--danger)'} /> Business Health ({data?.strategic_insights?.health_score ?? '—'}%)
               </div>
               <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                 {data?.strategic_insights?.health_message ?? 'No data available.'}
               </p>
            </div>
        </div>

        {/* Category Breakdown */}
        <div className="card glass" style={{ padding: '32px' }}>
           <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>Category Sales</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {(data?.sales_by_category || []).slice(0, 5).map(cat => (
                <div key={cat.category}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                      <span>{cat.category}</span>
                      <span style={{ color: 'var(--primary-blue)' }}>GH₵ {Number(cat.revenue || 0).toLocaleString()}</span>
                   </div>
                   <div style={{ height: '4px', background: 'var(--bg-surface-secondary)', borderRadius: '10px' }}>
                      <div style={{ 
                        height: '100%', 
                        background: 'var(--primary-blue)', 
                        width: `${(data?.total_revenue || 0) > 0 ? (Number(cat.revenue || 0) / data.total_revenue) * 100 : 0}%` 
                      }}></div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Recent Transactions */}
        <div className="card glass" style={{ gridColumn: 'span 2', padding: '32px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Recent Transactions</h3>
              <Layers size={18} color="var(--text-muted)" />
           </div>
           <div className="table-container" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                 <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                       <th style={{ padding: '12px' }}>Order ID</th>
                       <th style={{ padding: '12px' }}>Customer</th>
                       <th style={{ padding: '12px' }}>Type</th>
                       <th style={{ padding: '12px' }}>Amount</th>
                       <th style={{ padding: '12px' }}>Status</th>
                    </tr>
                 </thead>
                 <tbody>
                    {data.recent_activity?.map(order => (
                       <tr key={order.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>
                          <td style={{ padding: '12px', fontWeight: 700 }}>#{order.id}</td>
                          <td style={{ padding: '12px' }}>{order.customer_name || 'Walk-in Customer'}</td>
                          <td style={{ padding: '12px' }}>
                             <span style={{ 
                               background: order.order_type === 'pos' ? 'rgba(var(--accent-gold-rgb), 0.1)' : 'rgba(var(--accent-blue-rgb), 0.1)',
                               color: order.order_type === 'pos' ? 'var(--accent-gold)' : 'var(--accent-blue)',
                               padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase'
                             }}>
                                {order.order_type || 'online'}
                             </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: 700 }}>GH₵ {Number(order.total_amount).toLocaleString()}</td>
                          <td style={{ padding: '12px' }}>
                             <span style={{ 
                               color: order.status === 'delivered' ? 'var(--success)' : 'var(--warning)',
                               fontWeight: 600, fontSize: '11px'
                             }}>
                                {order.status}
                             </span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
}
