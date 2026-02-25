import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Users, ArrowUpRight, TrendingUp } from 'lucide-react';
import { fetchOrders, fetchCustomers } from '../services/api';

const StatCard = ({ icon, label, value, trend, trendLabel }) => (
  <div className="card glass" style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ padding: '10px', background: 'var(--info-bg)', borderRadius: '12px', color: 'var(--primary-blue)' }}>
        {icon}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '12px', fontWeight: 600 }}>
        {trend} <ArrowUpRight size={14} />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '28px', fontWeight: 800, margin: '4px 0' }}>{value}</span>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{trendLabel}</span>
    </div>
  </div>
);

const SimpleBarChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value), 100);
  
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '240px', paddingTop: '20px', gap: '12px' }}>
      {data.map((item, i) => {
        const height = (item.value / maxValue) * 100;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', height: '100%' }}>
            <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
               <div 
                title={`$${item.value.toFixed(2)}`}
                style={{ 
                  width: '100%', 
                  height: `${height}%`, 
                  background: 'linear-gradient(to top, var(--primary-blue), var(--accent-blue))',
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative'
                }} 
              >
                 {item.value > 0 && (
                   <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                     ${item.value > 1000 ? (item.value/1000).toFixed(1)+'k' : item.value.toFixed(0)}
                   </div>
                 )}
              </div>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{item.name}</span>
          </div>
        );
      })}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState({ 
    revenue: 0, 
    orders: 0, 
    customers: 0,
    trends: { revenue: '0%', orders: '0%', customers: '0%' },
    fullChartData: { monthly: [], weekly: [] }
  });
  const user = JSON.parse(localStorage.getItem('ehub_user') || '{}');
  const isAccountant = user.role === 'accountant';
  const isMarketing = user.role === 'marketing';
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'weekly'
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [ordersData, customersData] = await Promise.all([
          fetchOrders(),
          fetchCustomers()
        ]);

        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        
        // ── Calculate Trends ──────────────────────────────────────────────────
        const currentMonthOrders = ordersData.filter(o => {
          const d = new Date(o.date);
          return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        });

        const prevMonthOrders = ordersData.filter(o => {
          const d = new Date(o.date);
          const targetMonth = thisMonth === 0 ? 11 : thisMonth - 1;
          const targetYear = thisMonth === 0 ? thisYear - 1 : thisYear;
          return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
        });

        const currentRevenue = currentMonthOrders.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
        const prevRevenue = prevMonthOrders.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
        
        const revTrend = prevRevenue === 0 ? (currentRevenue > 0 ? '+100%' : '0%') : 
          `${(((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)}%`;
        
        const orderTrend = prevMonthOrders.length === 0 ? (currentMonthOrders.length > 0 ? '+100%' : '0%') :
          `${(((currentMonthOrders.length - prevMonthOrders.length) / prevMonthOrders.length) * 100).toFixed(1)}%`;

        // ── Process Monthly Data (Full Year - 12 Months) ──────────────────────
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyData = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = d.getMonth();
            const y = d.getFullYear();
            
            const monthlyTotal = ordersData
                .filter(o => {
                    const od = new Date(o.date);
                    return od.getMonth() === m && od.getFullYear() === y;
                })
                .reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
            
            monthlyData.push({
                name: monthNames[m],
                value: monthlyTotal
            });
        }

        // ── Process Weekly Data (Last 7 Days) ─────────────────────────────────
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = d.toDateString();
            
            const dailyTotal = ordersData
                .filter(o => new Date(o.date).toDateString() === dateStr)
                .reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
            
            weeklyData.push({
                name: dayNames[d.getDay()],
                value: dailyTotal
            });
        }

        setStats({
          revenue: ordersData.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0),
          orders: ordersData.length,
          customers: customersData.length,
          trends: {
            revenue: revTrend.startsWith('-') ? revTrend : `+${revTrend}`,
            orders: orderTrend.startsWith('-') ? orderTrend : `+${orderTrend}`,
            customers: '+0.0%' 
          },
          fullChartData: { monthly: monthlyData, weekly: weeklyData }
        });

        setRecentOrders(ordersData.slice(0, 4));
      } catch (error) {
        console.error("Dashboard data load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header>
        <h1 style={{ fontSize: '32px', fontWeight: 800 }}>
          {isAccountant ? 'Financial Overview' : isMarketing ? 'Promotional Overview' : 'Overview'}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {isAccountant ? "Reviewing the platform's financial health and performance stats." : 
           isMarketing ? "Monitoring product performance and store-front engagement." : 
           "Welcome back, Admin. Here's what's happening today."}
        </p>
      </header>

      <div style={{ display: 'flex', gap: '24px' }}>
        <StatCard 
          icon={<DollarSign size={24} />} 
          label="Total Revenue" 
          value={`$${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          trend={stats.trends.revenue} 
          trendLabel="vs last month"
        />
        <StatCard 
          icon={<ShoppingBag size={24} />} 
          label="Total Orders" 
          value={stats.orders.toString()} 
          trend={stats.trends.orders} 
          trendLabel="vs last month"
        />
        <StatCard 
          icon={<Users size={24} />} 
          label="New Customers" 
          value={stats.customers.toString()} 
          trend={stats.trends.customers} 
          trendLabel="vs last month"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Sales Activity</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={viewMode === 'monthly' ? 'btn btn-primary' : 'btn'} 
                style={{ padding: '6px 12px', fontSize: '12px', background: viewMode === 'monthly' ? 'var(--primary-blue)' : 'var(--bg-surface-secondary)' }}
                onClick={() => setViewMode('monthly')}
              >
                Monthly
              </button>
              <button 
                className={viewMode === 'weekly' ? 'btn btn-primary' : 'btn'} 
                style={{ padding: '6px 12px', fontSize: '12px', background: viewMode === 'weekly' ? 'var(--primary-blue)' : 'var(--bg-surface-secondary)' }}
                onClick={() => setViewMode('weekly')}
              >
                Weekly
              </button>
            </div>
          </div>
          <div style={{ padding: '10px 20px' }}>
            <SimpleBarChart data={stats.fullChartData[viewMode]} />
          </div>
        </div>

        <div className="card glass">
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Recent Orders</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentOrders.length > 0 ? recentOrders.map((order) => (
              <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-surface-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-blue)', fontWeight: 700, fontSize: '12px' }}>
                  {order.customer.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{order.id}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{order.customer} • ${parseFloat(order.amount).toFixed(2)}</div>
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: order.status === 'delivered' ? 'var(--success)' : order.status === 'shipped' ? 'var(--accent-blue)' : 'var(--warning)', 
                  background: order.status === 'delivered' ? 'var(--success-bg)' : order.status === 'shipped' ? 'var(--info-bg)' : 'var(--warning-bg)', 
                  padding: '4px 8px', 
                  borderRadius: '4px' 
                }}>
                  {order.status}
                </div>
              </div>
            )) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No orders found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
