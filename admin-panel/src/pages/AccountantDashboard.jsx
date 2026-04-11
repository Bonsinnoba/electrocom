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

export default function AccountantDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>Revenue Velocity</h3>
            <div style={{ width: '100%', height: '300px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenue_chart}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                     <XAxis dataKey="date" hide />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                     <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                     <Area type="monotone" dataKey="daily_revenue" stroke="var(--primary-blue)" fill="var(--primary-blue)" fillOpacity={0.05} strokeWidth={3} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Category Breakdown */}
         <div className="card glass" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>Top Categories</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               {data.sales_by_category.slice(0, 5).map((cat, idx) => (
                  <div key={cat.category}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                        <span>{cat.category}</span>
                        <span style={{ color: 'var(--primary-blue)' }}>GH₵ {Number(cat.revenue).toLocaleString()}</span>
                     </div>
                     <div style={{ height: '6px', background: 'var(--bg-surface-secondary)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--primary-blue)', width: `${(cat.revenue / data.total_revenue) * 100}%` }}></div>
                     </div>
                  </div>
               ))}
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
