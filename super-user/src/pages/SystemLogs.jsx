import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal, RefreshCw, Trash2, Download, Filter,
  AlertTriangle, Info, CheckCircle, XCircle, Search,
  ChevronDown, Clock
} from 'lucide-react';

// ── Mock log generator (replaces super_logs.php when API is offline) ──────────
const MOCK_EVENTS = [
  { level: 'error',   source: 'KMS-01',    msg: 'Brute-force login attempt detected – IP 196.4.12.88 blocked' },
  { level: 'warn',    source: 'ACC-01',    msg: 'Disk usage at 87%. Cleanup recommended.' },
  { level: 'info',    source: 'CORE',      msg: 'Global database backup completed successfully (3.2 GB).' },
  { level: 'info',    source: 'WA-01',     msg: 'Node heartbeat confirmed. Uptime: 99.9%' },
  { level: 'success', source: 'PAYMENTS',  msg: 'Paystack webhook verified — GH₵ 450.00 settled.' },
  { level: 'error',   source: 'MAILER',    msg: 'SMTP timeout after 30s – message queued for retry.' },
  { level: 'info',    source: 'PRODUCTS',  msg: 'Product catalogue refreshed: 5 SKUs updated.' },
  { level: 'warn',    source: 'SESSION',   msg: 'Unusual spike in concurrent sessions (+212%).' },
  { level: 'success', source: 'ORDERS',    msg: '47 orders processed in last 60 minutes.' },
  { level: 'info',    source: 'AUTH',      msg: 'Super User panel login — user root@essentialshub.gh' },
  { level: 'error',   source: 'ACC-01',    msg: 'PHP Fatal Error in admin_products.php:82 — division by zero' },
  { level: 'success', source: 'CDN',       msg: 'Assets purged and re-cached globally. TTL reset.' },
];

function seedLogs(n = 40) {
  const logs = [];
  const base = Date.now() - n * 60000;
  for (let i = 0; i < n; i++) {
    const ev = MOCK_EVENTS[i % MOCK_EVENTS.length];
    logs.push({ id: i + 1, ...ev, ts: new Date(base + i * 60000 + Math.random() * 55000).toISOString() });
  }
  return logs.reverse();
}

const LEVEL_STYLE = {
  error:   { bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.25)',   color: '#ef4444',  Icon: XCircle,      label: 'ERROR' },
  warn:    { bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)',  color: '#f59e0b',  Icon: AlertTriangle, label: 'WARN' },
  info:    { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)',   color: '#60a5fa',  Icon: Info,          label: 'INFO' },
  success: { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',    color: '#22c55e',  Icon: CheckCircle,   label: 'OK' },
};

function fmtTs(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function SystemLogs() {
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [levelFilter, setLevel]   = useState('all');
  const [autoRefresh, setAuto]    = useState(false);
  const intervalRef = useRef(null);

  const load = () => {
    setLoading(true);
    // Try real API first; fall back to mock
    fetch('http://localhost/EssentialsHub-project/api/super_logs.php', {
      headers: { Authorization: `Bearer ${localStorage.getItem('super_token') || ''}` }
    })
      .then(r => r.json())
      .then(d => setLogs(d.data || seedLogs()))
      .catch(() => setLogs(seedLogs()))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (autoRefresh) {
      intervalRef.current = setInterval(load, 10000);
    }
  }, [autoRefresh]);

  const clearAll = () => {
    setLogs([]);
    fetch('http://localhost/EssentialsHub-project/api/super_logs.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('super_token') || ''}` },
      body: JSON.stringify({ action: 'clear' })
    }).catch(() => {});
  };

  const downloadLogs = () => {
    const text = logs.map(l => `[${l.ts}] [${l.level.toUpperCase()}] [${l.source}] ${l.msg}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `system-logs-${Date.now()}.txt` });
    a.click(); URL.revokeObjectURL(url);
  };

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    return (levelFilter === 'all' || l.level === levelFilter) &&
      (l.msg?.toLowerCase().includes(q) || l.source?.toLowerCase().includes(q));
  });

  const counts = { total: logs.length, error: logs.filter(l => l.level === 'error').length, warn: logs.filter(l => l.level === 'warn').length };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '34px', fontWeight: 900, letterSpacing: '-1px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Terminal size={32} color="var(--primary-gold)" />
            System Logs
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
            Centralised event stream for all nodes, services, and security events.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={downloadLogs} style={{ padding: '10px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-light)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Download size={15} /> Export
          </button>
          <button onClick={clearAll} style={{ padding: '10px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Trash2 size={15} /> Clear
          </button>
          <button
            onClick={load}
            className="btn-primary"
            style={{ padding: '10px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px' }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </header>

      {/* Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Events', value: counts.total, col: '#94a3b8' },
          { label: 'Errors',       value: counts.error,  col: '#ef4444' },
          { label: 'Warnings',     value: counts.warn,   col: '#f59e0b' },
          { label: 'Showing',      value: filtered.length, col: 'var(--primary-gold)' },
        ].map((s, i) => (
          <div key={i} className="card glass" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: s.col }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter logs…"
            style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', color: '#fff', fontSize: '13px', outline: 'none' }}
          />
        </div>
        <select value={levelFilter} onChange={e => setLevel(e.target.value)} style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          <option value="all">All Levels</option>
          <option value="error">Errors</option>
          <option value="warn">Warnings</option>
          <option value="info">Info</option>
          <option value="success">Success</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: autoRefresh ? 'var(--primary-gold)' : 'var(--text-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={autoRefresh} onChange={e => setAuto(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--primary-gold)', cursor: 'pointer' }} />
          Auto (10s)
        </label>
      </div>

      {/* Log Stream */}
      <div className="card glass" style={{ padding: '0', overflow: 'hidden', fontFamily: "'Outfit', monospace" }}>
        {/* Terminal top bar */}
        <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: '12px', height: '12px', borderRadius: '50%', background: c }} />)}
          <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>essentialshub-core — system.log</span>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading events…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No matching log entries.</div>
        ) : (
          <div style={{ maxHeight: '560px', overflowY: 'auto', padding: '8px 0' }}>
            {filtered.map((log, i) => {
              const s = LEVEL_STYLE[log.level] || LEVEL_STYLE.info;
              return (
                <div key={log.id ?? i} style={{
                  display: 'flex', gap: '14px', alignItems: 'flex-start',
                  padding: '10px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.02)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  transition: 'background 0.15s'
                }}>
                  {/* Level badge */}
                  <div style={{ padding: '3px 8px', borderRadius: '6px', background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: '10px', fontWeight: 900, letterSpacing: '0.5px', flexShrink: 0, width: '58px', textAlign: 'center', marginTop: '1px' }}>
                    {s.label}
                  </div>
                  {/* Source */}
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary-gold)', width: '80px', flexShrink: 0, paddingTop: '2px' }}>
                    [{log.source}]
                  </div>
                  {/* Message */}
                  <div style={{ flex: 1, fontSize: '13px', color: '#e2e8f0', lineHeight: 1.5 }}>{log.msg}</div>
                  {/* Timestamp */}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, paddingTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={10} />
                    {fmtTs(log.ts)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
