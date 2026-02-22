import React, { useState, useEffect } from 'react';
import {
  MapPin, Users, Activity, RefreshCw, CheckCircle,
  Clock, AlertTriangle, Server, Wifi, WifiOff, Plus,
  MoreVertical, TrendingUp, Zap
} from 'lucide-react';
import { getUsers } from '../services/api';

// ── Simulated branch node data (extend with real DB when branch table exists) ─
const BRANCH_NODES = [
  { id: 'ACC-01', name: 'Accra Headquarters', region: 'Greater Accra', status: 'Online', uptime: '99.9%', load: 82, capacity: 100, lat: '5.6037° N', lon: '0.1870° W' },
  { id: 'KMS-01', name: 'Kumasi Distribution', region: 'Ashanti', status: 'Online', uptime: '98.4%', load: 45, capacity: 100, lat: '6.6885° N', lon: '1.6244° W' },
  { id: 'WA-01',  name: 'Wa Regional Office', region: 'Upper West', status: 'Standby', uptime: '95.1%', load: 12, capacity: 100, lat: '10.0601° N', lon: '2.5099° W' },
];

const statusColor = {
  Online:  { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  text: '#22c55e', dot: '#22c55e' },
  Standby: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b', dot: '#f59e0b' },
  Offline: { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  text: '#ef4444', dot: '#ef4444' },
};

function LoadBar({ value, max = 100 }) {
  const pct = Math.round((value / max) * 100);
  const colour = pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#22c55e';
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 700 }}>
        <span>System Load</span><span style={{ color: colour }}>{pct}%</span>
      </div>
      <div style={{ height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: colour, borderRadius: '3px', transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}

export default function BranchManagement() {
  const [branches, setBranches] = useState(BRANCH_NODES);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      const res = await getUsers();
      const allUsers = res.data || [];
      setAdmins(allUsers.filter(u => u.role === 'admin'));
    } catch {
      // Use mock data if API unavailable
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    // Simulate slight load fluctuation for demo
    setBranches(prev => prev.map(b => ({
      ...b,
      load: Math.min(100, Math.max(5, b.load + Math.floor(Math.random() * 10 - 5)))
    })));
    setTimeout(() => setRefreshing(false), 800);
  };

  const totalOnline  = branches.filter(b => b.status === 'Online').length;
  const avgLoad      = Math.round(branches.reduce((a, b) => a + b.load, 0) / branches.length);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-1px', marginBottom: '6px' }}>Branch Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
            Real-time status of all registered EssentialsHub branch nodes.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px' }}
        >
          <RefreshCw size={16} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          {refreshing ? 'Syncing…' : 'Refresh Nodes'}
        </button>
      </header>

      {/* Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Branches', value: branches.length, icon: <Server size={18} />, col: 'var(--primary-gold)' },
          { label: 'Online Nodes',   value: totalOnline,       icon: <Wifi size={18} />,     col: '#22c55e' },
          { label: 'Avg. Load',      value: `${avgLoad}%`,     icon: <Activity size={18} />, col: '#3b82f6' },
          { label: 'Admin Operators',value: admins.length,     icon: <Users size={18} />,    col: '#a855f7' },
        ].map((s, i) => (
          <div key={i} className="card glass" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', color: s.col }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 900 }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Branch Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <Activity size={32} style={{ opacity: 0.4, marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
          Loading branch data…
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {branches.map(branch => {
            const sc = statusColor[branch.status] || statusColor.Offline;
            const isSelected = selected === branch.id;
            return (
              <div
                key={branch.id}
                className="card glass"
                onClick={() => setSelected(isSelected ? null : branch.id)}
                style={{ cursor: 'pointer', border: `1px solid ${isSelected ? 'var(--primary-gold)' : sc.border}`, transition: 'all 0.25s', position: 'relative', overflow: 'hidden' }}
              >
                {/* Glow blob */}
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: sc.dot, filter: 'blur(40px)', opacity: 0.15, pointerEvents: 'none' }} />

                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ padding: '10px', borderRadius: '12px', background: sc.bg, border: `1px solid ${sc.border}` }}>
                      <MapPin size={20} color={sc.dot} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '2px' }}>{branch.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{branch.region}</div>
                    </div>
                  </div>
                  <div style={{ padding: '5px 12px', borderRadius: '20px', background: sc.bg, border: `1px solid ${sc.border}`, fontSize: '12px', fontWeight: 800, color: sc.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot, animation: branch.status === 'Online' ? 'pulse 2s infinite' : 'none' }} />
                    {branch.status}
                  </div>
                </div>

                {/* Load Bar */}
                <LoadBar value={branch.load} />

                {/* Metadata row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary-gold)' }}>{branch.id}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Node Code</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#22c55e' }}>{branch.uptime}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Uptime (30d)</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 900 }}>
                      {admins.length > 0 ? Math.ceil(admins.length / branches.length) : '—'}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Operators</div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isSelected && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>GPS Coordinates</div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1, padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                        📍 Lat: {branch.lat}
                      </div>
                      <div style={{ flex: 1, padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                        📍 Lon: {branch.lon}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: '12px', textAlign: 'center' }}>Ping Node</button>
                      <button style={{ flex: 1, padding: '10px', fontSize: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Force Restart</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Spin keyframe injected inline */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
