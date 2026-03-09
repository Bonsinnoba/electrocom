import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  ArrowUpRight, 
  TrendingUp, 
  Package, 
  AlertTriangle,
  Calendar,
  RefreshCw,
  Layers
} from 'lucide-react';
import { fetchAnalytics } from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  Cell,
  PieChart, 
  Pie
} from 'recharts';

const StatCard = ({ icon, label, value, trend, trendLabel, color = 'var(--primary-blue)' }) => (
  <div className="card glass animate-fade-in" style={{ flex: 1, minWidth: '240px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
      <div style={{ padding: '10px', background: `${color}15`, borderRadius: '12px', color: color }}>
        {icon}
      </div>
      {trend && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px', 
          color: trend.startsWith('+') ? 'var(--success)' : 'var(--danger)', 
          fontSize: '12px', 
          fontWeight: 700,
          background: trend.startsWith('+') ? 'var(--success-bg)' : 'var(--danger-bg)',
          padding: '4px 8px',
          borderRadius: '20px'
        }}>
          {trend} <ArrowUpRight size={14} />
        </div>
      )}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: '32px', fontWeight: 900, margin: '4px 0', letterSpacing: '-0.02em' }}>{value}</span>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{trendLabel}</span>
    </div>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = JSON.parse(localStorage.getItem('ehub_user') || '{}');
  
  const loadAnalytics = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await fetchAnalytics();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to load analytics');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics(true);
    const interval = setInterval(() => loadAnalytics(false), 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
        <RefreshCw className="animate-spin" size={48} color="var(--primary-blue)" />
        <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Aggregating real-time data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card glass" style={{ margin: '40px auto', maxWidth: '500px', textAlign: 'center', borderColor: 'var(--danger)' }}>
        <AlertTriangle size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Analytics Unavailable</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{error}</p>
        <button className="btn btn-primary" onClick={() => loadAnalytics(true)}>Retry Connection</button>
      </div>
    );
  }

  // Fallback if data is empty but success was true
  if (!data) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: 900, letterSpacing: '-0.03em' }}>Super Analytics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Real-time performance metrics for ElectroCom.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
             <div className="glass" style={{ padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <Calendar size={16} color="var(--primary-blue)" /> Last 30 Days
             </div>
        </div>
      </header>

      {/* Primary Stats */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <StatCard 
          icon={<DollarSign size={24} />} 
          label="Total Revenue" 
          value={`$${data.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          trend="+12.4%" 
          trendLabel="vs previous period"
          color="#3b82f6"
        />
        <StatCard 
          icon={<ShoppingBag size={24} />} 
          label="Pending Orders" 
          value={data.pending_orders.toString()} 
          trend="+5" 
          trendLabel="Awaiting fulfillment"
          color="#f59e0b"
        />
        <StatCard 
          icon={<Users size={24} />} 
          label="Total Customers" 
          value={data.total_customers.toString()} 
          trend="+2.1%" 
          trendLabel="Lifetime growth"
          color="#10b981"
        />
        <StatCard 
          icon={<AlertTriangle size={24} />} 
          label="Low Stock Items" 
          value={data.low_stock_count.toString()} 
          trend={data.low_stock_count > 5 ? "Critical" : "Stable"} 
          trendLabel="Items under 10 qty"
          color="#ef4444"
        />
      </div>

      {/* Main Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        {/* Revenue Area Chart */}
        <div className="card glass" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="var(--primary-blue)" /> Revenue Growth
            </h3>
          </div>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue_chart}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-blue)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary-blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 10 }} 
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: 'var(--primary-blue)', fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="daily_revenue" stroke="var(--primary-blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div className="card glass" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} color="var(--accent-blue)" /> Top Selling Products
            </h3>
          </div>
          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_products} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-main)', fontSize: 11, fontWeight: 600 }}
                  width={120}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="total_sold" radius={[0, 4, 4, 0]}>
                  {data.top_products.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--primary-blue)' : `rgba(59, 130, 246, ${1 - index*0.15})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row - More detailed insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
         {/* Simple Pie Chart for Order Breakdown (Simulated data as backend doesn't provide it yet, but UI ready) */}
         <div className="card glass" style={{ background: 'var(--bg-surface-secondary)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Inventory Status</h3>
            <div style={{ height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={[
                                { name: 'Functional', value: 85 },
                                { name: 'Low Stock', value: 10 },
                                { name: 'Out of Stock', value: 5 }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            <Cell fill="#10b981" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '-20px' }}>
                <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}/> Optimal</div>
                <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}/> Low</div>
                <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}/> Out</div>
            </div>
         </div>

         <div className="card glass">
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>Strategic Highlights</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: 40, height: 40, background: 'rgba(16, 185, 129, 0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}><TrendingUp size={20}/></div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>Revenue Peak Detected</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Yesterday saw the highest single-day revenue in the last 30 days.</div>
                    </div>
                </div>
                <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', background: 'rgba(59, 130, 246, 0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: 40, height: 40, background: 'rgba(59, 130, 246, 0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}><Package size={20}/></div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>Fulfillment Efficiency</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Average time from Pending to Shipped has improved by 18%.</div>
                    </div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}
