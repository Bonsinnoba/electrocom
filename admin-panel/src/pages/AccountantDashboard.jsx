import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Download, 
  Calendar, 
  ArrowUpRight, 
  CreditCard,
  PieChart,
  BarChart3,
  Search,
  ArrowRight
} from 'lucide-react';
import { fetchAnalytics } from '../services/api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

const toDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const buildFilledSeries = (source, days, numericKeys) => {
  const list = Array.isArray(source) ? source : [];
  if (days !== 7) return list.slice(-days);
  const mapped = new Map();
  list.forEach((entry) => {
    const key = toDateKey(entry?.date);
    if (key) mapped.set(key, entry);
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const filled = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toDateKey(d);
    const base = mapped.get(key) || {};
    const row = { ...base, date: d.toISOString().slice(0, 10), _isFilled: !mapped.has(key) };
    numericKeys.forEach((k) => {
      row[k] = Number(base[k] || 0);
    });
    filled.push(row);
  }
  return filled;
};

export default function AccountantDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartRange, setChartRange] = useState(30);
  const [chartMode, setChartMode] = useState('area');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchAnalytics();
        if (res.success) setData(res.data);
      } catch (err) {
        setError('Failed to load financial records');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="loading-state">Synchronizing Financials...</div>;
  if (!data) return <div className="error-state">{error || 'No financial data available.'}</div>;
  const filteredRevenueChart = buildFilledSeries(data.revenue_chart, chartRange, ['daily_revenue']);
  const formatChartTick = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    if (chartRange === 7) return d.toLocaleString('en-US', { weekday: 'short' });
    return `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.02em' }}>Financial Ledger</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Audited regional revenue and transactional insights.</p>
        </div>
        <button className="btn glass" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700 }}>
          <Download size={16} /> EXPORT REPORT
        </button>
      </header>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div className="card glass" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(var(--accent-blue-rgb), 0.1)', color: 'var(--primary-blue)' }}>
              <DollarSign size={20} />
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              +12% <ArrowUpRight size={14} />
            </div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gross Revenue</div>
          <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '4px' }}>GH₵ {data.total_revenue.toLocaleString()}</div>
        </div>

        <div className="card glass" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(var(--accent-gold-rgb), 0.1)', color: 'var(--accent-gold)' }}>
              <CreditCard size={20} />
            </div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>POS Transactions</div>
          <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '4px' }}>GH₵ {data.revenue_pos.toLocaleString()}</div>
        </div>

        <div className="card glass" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--success-bg)', color: 'var(--success)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg. Transaction</div>
          <div style={{ fontSize: '28px', fontWeight: 900, marginTop: '4px' }}>GH₵ {data.avg_order_value.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
         {/* Revenue Velocity */}
         <div className="card glass" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: 0 }}>Revenue Velocity</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[7, 30, 90].map((days) => (
                  <button key={days} type="button" className={`btn ${chartRange === days ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '5px 10px', fontSize: '11px' }} onClick={() => setChartRange(days)}>
                    {days}d
                  </button>
                ))}
                <button type="button" className={`btn ${chartMode === 'area' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '5px 10px', fontSize: '11px' }} onClick={() => setChartMode('area')}>
                  Area
                </button>
                <button type="button" className={`btn ${chartMode === 'bar' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '5px 10px', fontSize: '11px' }} onClick={() => setChartMode('bar')}>
                  Bar
                </button>
              </div>
            </div>
            <div style={{ width: '100%', height: '300px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  {chartMode === 'area' ? (
                  <AreaChart data={filteredRevenueChart}>
                     <defs>
                       <linearGradient id="accountRevenueFill" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="var(--primary-blue)" stopOpacity={0.25} />
                         <stop offset="95%" stopColor="var(--primary-blue)" stopOpacity={0} />
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border-light)" />
                     <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                        tickFormatter={formatChartTick}
                     />
                     <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                        tickFormatter={(v) => `GH₵${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                     />
                     <Tooltip
                        contentStyle={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-light)' }}
                        formatter={(value, _name, ctx) => [`GH₵ ${Number(value || 0).toLocaleString()}`, ctx?.payload?._isFilled ? 'Revenue (auto-filled)' : 'Revenue']}
                     />
                     <Area type="monotone" dataKey="daily_revenue" stroke="var(--primary-blue)" fill="url(#accountRevenueFill)" strokeWidth={3} />
                  </AreaChart>
                  ) : (
                  <BarChart data={filteredRevenueChart}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border-light)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={formatChartTick} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(v) => `GH₵${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} />
                    <Tooltip contentStyle={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-light)' }} formatter={(value, _name, ctx) => [`GH₵ ${Number(value || 0).toLocaleString()}`, ctx?.payload?._isFilled ? 'Revenue (auto-filled)' : 'Revenue']} />
                    <Bar dataKey="daily_revenue" fill="var(--primary-blue)" radius={[8, 8, 0, 0]} barSize={14} maxBarSize={16}>
                      {filteredRevenueChart.map((entry, idx) => (
                        <Cell key={`acct-rev-cell-${idx}`} fill={entry._isFilled ? 'rgba(var(--primary-blue-rgb), 0.35)' : 'var(--primary-blue)'} />
                      ))}
                    </Bar>
                  </BarChart>
                  )}
               </ResponsiveContainer>
            </div>
         </div>

         {/* Category Breakdown */}
         <div className="card glass" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>Top Categories</h3>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.sales_by_category.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border-light)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(v) => `GH₵${v >= 1000 ? `${Math.round(v/1000)}k` : v}`} />
                  <YAxis type="category" dataKey="category" width={95} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(str) => String(str).length > 13 ? `${String(str).slice(0, 13)}...` : str} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-light)' }}
                    formatter={(value) => [`GH₵ ${Number(value || 0).toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
                    {data.sales_by_category.slice(0, 5).map((_, index) => (
                      <Cell key={`cat-cell-${index}`} fill={index === 0 ? 'var(--primary-blue)' : index === 1 ? 'var(--accent-blue)' : index === 2 ? '#8b5cf6' : index === 3 ? '#16a34a' : '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* Transaction Feed */}
      <section>
         <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Recent Audit Logs</h3>
         <div className="card glass" style={{ padding: '0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                     <th style={{ padding: '16px' }}>Order ID</th>
                     <th style={{ padding: '16px' }}>Customer</th>
                     <th style={{ padding: '16px' }}>Total Amount</th>
                     <th style={{ padding: '16px' }}>Type</th>
                     <th style={{ padding: '16px' }}>Status</th>
                  </tr>
               </thead>
               <tbody>
                  {data.recent_activity.map(order => (
                     <tr key={order.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>
                        <td style={{ padding: '16px', fontWeight: 700 }}>#{order.id}</td>
                        <td style={{ padding: '16px' }}>{order.customer_name || 'Walk-in'}</td>
                        <td style={{ padding: '16px', fontWeight: 800 }}>GH₵ {Number(order.total_amount).toLocaleString()}</td>
                        <td style={{ padding: '16px' }}>
                           <span style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 700 }} className={order.order_type === 'pos' ? 'text-warning' : 'text-primary'}>
                              {order.order_type || 'online'}
                           </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                           <span style={{ fontSize: '11px', fontWeight: 600 }}>{order.status}</span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </section>
    </div>
  );
}
