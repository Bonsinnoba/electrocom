import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Map, 
  ShieldAlert, 
  ShieldOff, 
  Globe, 
  Filter, 
  Trash2, 
  Plus, 
  Search, 
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { fetchTrafficStats, addRestriction, removeRestriction, clearTrafficHour } from '../../services/api';

const StatCard = ({ icon, label, value, color }) => (
  <div className="card glass" style={{ flex: 1, borderLeft: `4px solid ${color}` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ padding: '12px', background: `${color}15`, borderRadius: '12px', color: color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: '24px', fontWeight: 800 }}>{value}</div>
      </div>
    </div>
  </div>
);

export default function TrafficControl() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRestriction, setNewRestriction] = useState({
    type: 'country',
    value: '',
    reason: ''
  });

  useEffect(() => {
    loadStats();
    const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
            loadStats();
        }
    }, 45000); // Increased from 30s to 45s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await fetchTrafficStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError("Failed to load traffic data.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestriction = async (e) => {
    e.preventDefault();
    try {
      await addRestriction(newRestriction);
      setShowAddModal(false);
      setNewRestriction({ type: 'country', value: '', reason: '' });
      loadStats();
    } catch (err) {
      alert("Failed to add restriction.");
    }
  };

  const handleRemoveRestriction = async (id) => {
    if (!confirm("Are you sure you want to remove this restriction?")) return;
    try {
      await removeRestriction(id);
      loadStats();
    } catch (err) {
      alert("Failed to remove restriction.");
    }
  };

  const handleClearHour = async (hour) => {
    if (!confirm(`Are you sure you want to clear all traffic logs for ${hour}?`)) return;
    try {
      const result = await clearTrafficHour(hour);
      if (result.success) {
        loadStats();
      } else {
        alert(result.message || "Failed to clear hour.");
      }
    } catch (err) {
      alert("Error clearing hour.");
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Activity className="animate-spin" size={32} />
        <span style={{ marginLeft: '12px' }}>Loading real-time traffic...</span>
      </div>
    );
  }

  const filteredLogs = stats?.recentLogs.filter(log => 
    log.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.request_url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header className="page-header" style={{ marginBottom: '0' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity color="var(--primary-blue)" /> Traffic & Security
          </h1>
          <p className="page-subtitle">Monitor real-time site visitors and manage access restrictions.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus size={20} /> Add Restriction
        </button>
      </header>

      {error && (
        <div className="card" style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle /> {error}
        </div>
      )}

      {/* Overview Cards */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <StatCard 
          icon={<Activity size={24} />} 
          label="Total Page Views" 
          value={stats?.totalHits?.toLocaleString() || '0'} 
          color="var(--primary-blue)"
        />
        <StatCard 
          icon={<ShieldAlert size={24} />} 
          label="Active Restrictions" 
          value={stats?.restrictions?.length?.toString() || '0'} 
          color="var(--warning)"
        />
        <StatCard 
          icon={<Globe size={24} />} 
          label="Top Region" 
          value={stats?.countryStats?.[0]?.country || 'N/A'} 
          color="var(--success)"
        />
      </div>

      {/* Hourly Traffic Breakdown */}
      <div className="card glass" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--primary-blue)" /> Hourly Traffic Breakdown
          </h3>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Last 48 Hours</div>
        </div>
        <div style={{ padding: '12px 24px', maxHeight: '300px', overflowY: 'auto' }}>
          {stats?.hourlyStats?.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', padding: '12px 0' }}>
              {stats.hourlyStats.map((item) => (
                <div key={item.hour} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 16px', 
                  background: 'var(--bg-surface-secondary)', 
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{new Date(item.hour).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.count} hits recorded</div>
                  </div>
                  <button 
                    onClick={() => handleClearHour(item.hour)}
                    className="btn-danger"
                    style={{ padding: '8px', fontSize: '11px', gap: '4px' }}
                    title="Clear this hour"
                  >
                    <Trash2 size={14} /> Clear
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No hourly data available.</div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recent Traffic Table */}
        <div className="card glass" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--primary-blue)" /> Traffic Log
            </h3>
            <div style={{ position: 'relative', width: '200px' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
              <input 
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '32px' }}
              />
            </div>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>VISITOR</th>
                  <th style={{ padding: '12px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>URL</th>
                  <th style={{ padding: '12px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>TIME</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs?.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{log.ip_address}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Globe size={10} /> {log.country}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.request_url}>
                        {log.request_url}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLogs?.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No logs matching search.</div>
            )}
          </div>
        </div>

        {/* Restrictions List */}
        <div className="card glass" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="var(--danger)" /> Access Restrictions
            </h3>
          </div>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto' }}>
            {stats?.restrictions.map((res) => (
              <div key={res.id} className="card" style={{ padding: '16px', background: 'var(--bg-surface-secondary)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px', marginBottom: '8px', display: 'inline-block' }}>
                      {res.type} Blocked
                    </span>
                    <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{res.value}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{res.reason}</div>
                  </div>
                  <button 
                    onClick={() => handleRemoveRestriction(res.id)}
                    className="btn-danger"
                    style={{ padding: '8px' }}
                    title="Remove Restriction"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {stats?.restrictions.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Filter size={32} opacity={0.2} style={{ marginBottom: '12px' }} />
                <div>No active restrictions.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Restriction Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setShowAddModal(false)}></div>
          <div className="card glass animate-fade-in" style={{ position: 'relative', width: '100%', maxWidth: '450px', zIndex: 1001 }}>
            <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 800 }}>Add Restriction</h2>
            <form onSubmit={handleAddRestriction} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Type</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button"
                    className={newRestriction.type === 'country' ? 'btn btn-primary' : 'btn btn-secondary'}
                    onClick={() => setNewRestriction({...newRestriction, type: 'country'})}
                    style={{ flex: 1 }}
                  >
                    <Globe size={16} /> Country
                  </button>
                  <button 
                    type="button"
                    className={newRestriction.type === 'ip' ? 'btn btn-primary' : 'btn btn-secondary'}
                    onClick={() => setNewRestriction({...newRestriction, type: 'ip'})}
                    style={{ flex: 1 }}
                  >
                    <ShieldOff size={16} /> IP Address
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Value</label>
                <input 
                  type="text"
                  required
                  value={newRestriction.value}
                  onChange={(e) => setNewRestriction({...newRestriction, value: e.target.value})}
                  className="input-field"
                  placeholder={newRestriction.type === 'country' ? 'e.g. Nigeria' : 'e.g. 192.168.1.1'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Reason</label>
                <textarea 
                  required
                  value={newRestriction.reason}
                  onChange={(e) => setNewRestriction({...newRestriction, reason: e.target.value})}
                  className="input-field"
                  style={{ height: '80px', resize: 'none' }}
                  placeholder="Reason for restriction..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
