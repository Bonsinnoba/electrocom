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

export default function Dashboard() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [ordersData, customersData] = await Promise.all([
          fetchOrders(),
          fetchCustomers()
        ]);

        const totalRevenue = ordersData.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
        
        setStats({
          revenue: totalRevenue,
          orders: ordersData.length,
          customers: customersData.length
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
        <h1 style={{ fontSize: '32px', fontWeight: 800 }}>Overview</h1>
        <p style={{ color: 'var(--text-muted)' }}>Welcome back, Admin. Here's what's happening today.</p>
      </header>

      <div style={{ display: 'flex', gap: '24px' }}>
        <StatCard 
          icon={<DollarSign size={24} />} 
          label="Total Revenue" 
          value={`$${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          trend="+5.2%" 
          trendLabel="vs last month"
        />
        <StatCard 
          icon={<ShoppingBag size={24} />} 
          label="Total Orders" 
          value={stats.orders.toString()} 
          trend="+12.4%" 
          trendLabel="vs last month"
        />
        <StatCard 
          icon={<Users size={24} />} 
          label="New Customers" 
          value={stats.customers.toString()} 
          trend="+8.1%" 
          trendLabel="vs last month"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Sales Activity</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Monthly</button>
              <button className="btn" style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--bg-surface-secondary)' }}>Weekly</button>
            </div>
          </div>
          <div style={{ height: '300px', background: 'var(--bg-surface-secondary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <TrendingUp size={48} opacity={0.2} />
            <span style={{ marginLeft: '12px' }}>Analytics chart integration pending</span>
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
                  color: order.status === 'Delivered' ? 'var(--success)' : order.status === 'Shipped' ? 'var(--accent-blue)' : 'var(--warning)', 
                  background: order.status === 'Delivered' ? 'rgba(34, 197, 94, 1)' : order.status === 'Shipped' ? 'rgba(30, 124, 248, 1)' : 'rgba(245, 158, 11, 1)', 
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
