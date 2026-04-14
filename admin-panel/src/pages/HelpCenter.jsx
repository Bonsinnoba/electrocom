import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Zap,
  Users,
  Megaphone,
  Bell,
  Settings,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Lightbulb,
} from 'lucide-react';
import {
  HelpScreenshot,
  MockSidebar,
  MockCard,
  MockStatRow,
  MockTable,
  MockTabs,
  MockPOSCart,
} from '../components/help/HelpIllustration';

function StepList({ items }) {
  return (
    <ol className="help-steps">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ol>
  );
}

function Section({ id, icon, title, children }) {
  return (
    <section id={id} className="help-section card glass" style={{ padding: '28px 32px' }}>
      <h2 className="help-section-title">
        <span className="help-section-icon">{icon}</span>
        {title}
      </h2>
      <div className="help-section-body">{children}</div>
    </section>
  );
}

function JumpLink({ to, children }) {
  return (
    <Link to={to} className="help-jump-link">
      {children}
      <ChevronRight size={14} />
    </Link>
  );
}

export default function HelpCenter() {
  const { user } = useAuth();
  const role = user?.role || 'admin';
  const isSuper = role === 'super';
  const isAccountant = role === 'accountant';
  const isPicker = role === 'picker';
  const isMarketing = role === 'marketing';

  const toc = [
    { id: 'start', label: 'First steps' },
    ...(!isPicker && !isAccountant ? [{ id: 'dashboard', label: 'Dashboard' }] : []),
    ...(!isAccountant && !isPicker ? [{ id: 'inventory', label: 'Inventory' }] : []),
    ...(!isMarketing ? [{ id: 'sales', label: 'Sales & fulfillment' }] : []),
    ...(!isMarketing && !isAccountant && !isPicker ? [{ id: 'pos', label: 'POS & returns' }] : []),
    ...(!isPicker && (!isAccountant || !isMarketing) ? [{ id: 'marketing', label: 'Marketing' }] : []),
    ...(!isMarketing && !isPicker ? [{ id: 'customers', label: 'Customers' }] : []),
    { id: 'alerts', label: 'Alerts' },
    ...(!isMarketing ? [{ id: 'settings', label: 'Settings' }] : []),
    ...(isSuper ? [{ id: 'super', label: 'Super admin' }] : []),
  ];

  return (
    <div className="help-page animate-fade-in">
      <header className="help-hero card glass" style={{ padding: '32px 36px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(var(--accent-blue-rgb), 0.12)',
              color: 'var(--primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={28} />
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1 style={{ fontSize: 'clamp(26px, 4vw, 34px)', fontWeight: 900, marginBottom: 8, letterSpacing: '-0.02em' }}>
              Admin help &amp; how-to
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6, maxWidth: 720 }}>
              Task-based guides for your role. Each topic includes a <strong>window-style illustration</strong> (and will show your
              own screenshot if you add images under <code style={{ fontSize: 13 }}>public/help/</code> — see the README there).
            </p>
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'var(--info-bg)',
                border: '1px solid var(--border-light)',
                fontSize: 13,
                color: 'var(--text-main)',
              }}
            >
              <Lightbulb size={18} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
              <span>
                Signed in as <strong>{role}</strong>. Sections below match what you can usually access; links open the real screen in this app.
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="help-layout">
        <nav className="help-toc card glass" aria-label="On this page">
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 12 }}>
            On this page
          </div>
          <ul>
            {toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="help-articles">
          <Section id="start" icon={<BookOpen size={22} />} title="First steps">
            <p className="help-lead">
              Use the <strong>left sidebar</strong> to move between areas. Your role may hide some items — that is expected.
            </p>
            <StepList
              items={[
                'Log in with your staff email. Super users land on the global overview; others land on the main dashboard or role-specific home.',
                'Keep one browser tab on the admin URL; use the storefront in a separate tab if you need to verify what customers see.',
                'If something fails, check System Alerts and (for supers) System Logs under Root Control.',
                ...(isAccountant
                  ? ['Your home screen is the Finance dashboard — revenue-focused cards and exports live there.']
                  : []),
                ...(isPicker
                  ? ['Pickers: use Picker Hub and Sales & Fulfillment for the queue; catalog and POS are hidden by design.']
                  : []),
              ]}
            />
            <HelpScreenshot title="EssentialsHub Admin" urlBar="admin.example.com / Dashboard">
              <MockSidebar activeLabel="Dashboard" />
              <div className="help-mock-main">
                <div className="help-mock-h1" />
                <div className="help-mock-sub" />
                <MockCard>
                  <MockStatRow />
                </MockCard>
              </div>
            </HelpScreenshot>
          </Section>

          {!isPicker && !isAccountant && (
            <Section id="dashboard" icon={<LayoutDashboard size={22} />} title="Dashboard & analytics">
              <p className="help-lead">
                The dashboard summarizes revenue, orders, and suggested actions. Charts load in the background for speed.
              </p>
              <JumpLink to="/">Open Dashboard</JumpLink>
              <StepList
                items={[
                  'Review stat cards at the top for a quick health check.',
                  'Use the chart range toggles (7d / 30d / 90d) to change the revenue view.',
                  'Click a suggested action card to jump to Inventory, Sales, or Marketing when applicable.',
                ]}
              />
              <HelpScreenshot file="dashboard.png" title="Dashboard — EssentialsHub" urlBar="…/ (home)">
                <MockSidebar activeLabel="Dashboard" />
                <div className="help-mock-main">
                  <div className="help-mock-h1" />
                  <div className="help-mock-sub" />
                  <MockCard>
                    <MockStatRow />
                  </MockCard>
                  <MockCard style={{ minHeight: 80 }}>
                    <div style={{ height: 48, borderRadius: 8, background: 'rgba(var(--accent-blue-rgb), 0.12)' }} />
                  </MockCard>
                </div>
              </HelpScreenshot>
            </Section>
          )}

          {!isAccountant && !isPicker && (
            <Section id="inventory" icon={<Package size={22} />} title="Inventory & products">
              <p className="help-lead">
                <strong>Product Catalog</strong> is where you create and edit items. <strong>Bulk shelving</strong> updates Aisle / Rack / Bin for many SKUs at once.
              </p>
              <JumpLink to="/catalog">Open Inventory Hub</JumpLink>
              <StepList
                items={[
                  'Catalog: use Add Product or edit an existing row. Shelving uses Aisle, Rack, and Bin together (or free-text Location).',
                  'Product codes must be unique when set; the API blocks duplicates.',
                  'Bulk shelving: pick a category or select rows, enter Aisle/Rack/Bin, then Apply.',
                ]}
              />
              <HelpScreenshot file="inventory-catalog.png" title="Inventory Hub — Product Catalog" urlBar="…/catalog">
                <MockSidebar activeLabel="Inventory" />
                <div className="help-mock-main">
                  <div className="help-mock-h1" />
                  <MockTabs labels={['Product Catalog', 'Bulk shelving']} activeIndex={0} />
                  <MockCard>
                    <MockTable rows={4} />
                  </MockCard>
                </div>
              </HelpScreenshot>
              <HelpScreenshot file="inventory-bulk.png" title="Inventory Hub — Bulk shelving" urlBar="…/catalog (Bulk tab)">
                <MockSidebar activeLabel="Inventory" />
                <div className="help-mock-main">
                  <MockTabs labels={['Product Catalog', 'Bulk shelving']} activeIndex={1} />
                  <MockCard>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                      <div style={{ height: 28, borderRadius: 8, background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-light)' }} />
                      <div style={{ height: 28, borderRadius: 8, background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-light)' }} />
                      <div style={{ height: 28, borderRadius: 8, background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-light)' }} />
                    </div>
                    <MockTable rows={3} />
                  </MockCard>
                </div>
              </HelpScreenshot>
            </Section>
          )}

          {!isMarketing && (
            <Section id="sales" icon={<ShoppingCart size={22} />} title="Sales & fulfillment">
              <p className="help-lead">
                Manage <strong>orders</strong>, <strong>returns</strong> (non-POS), and <strong>abandoned carts</strong> where your role allows.
              </p>
              <JumpLink to="/sales">Open Sales &amp; Fulfillment</JumpLink>
              <StepList
                items={[
                  'Orders: update status, fulfill pickups, and track the queue (pickers see a focused queue).',
                  'Returns: search by order id or customer, select a line, enter quantity and reason — stock is restocked when processed.',
                  'Abandoned carts: review recovered carts if that tab is visible for your role.',
                ]}
              />
              <HelpScreenshot file="sales-orders.png" title="Sales — Orders" urlBar="…/sales">
                <MockSidebar activeLabel="Sales" />
                <div className="help-mock-main">
                  <MockTabs labels={['Active Orders', 'Returns', 'Abandoned']} activeIndex={0} />
                  <MockCard>
                    <MockTable rows={5} />
                  </MockCard>
                </div>
              </HelpScreenshot>
              <HelpScreenshot file="sales-returns.png" title="Sales — Returns" urlBar="…/sales (Returns)">
                <MockSidebar activeLabel="Sales" />
                <div className="help-mock-main">
                  <MockTabs labels={['Active Orders', 'Returns', 'Abandoned']} activeIndex={1} />
                  <MockCard>
                    <div style={{ height: 36, borderRadius: 8, background: 'var(--bg-surface-secondary)', marginBottom: 10 }} />
                    <MockTable rows={3} />
                  </MockCard>
                </div>
              </HelpScreenshot>
            </Section>
          )}

          {!isMarketing && !isAccountant && !isPicker && (
            <Section id="pos" icon={<Zap size={22} />} title="POS checkout & in-store returns">
              <p className="help-lead">
                <strong>POS Checkout</strong> is for walk-in sales. Use <strong>Return (48h)</strong> for POS receipts only, within 48 hours of the sale.
              </p>
              <JumpLink to="/pos">Open POS</JumpLink>
              <StepList
                items={[
                  'Sale: scan or search products, set payment method (cash / MoMo), optional customer email, then Process payment.',
                  'Return: switch to Return (48h), enter order number (e.g. ORD-42), Load lines, enter quantities, Confirm return — stock increases automatically.',
                  'Online orders are not returned here; use Sales → Returns for those.',
                ]}
              />
              <HelpScreenshot file="pos-sale.png" title="POS — Sale mode" urlBar="…/pos">
                <MockSidebar activeLabel="POS" />
                <div className="help-mock-main">
                  <div className="help-mock-tabs" style={{ marginBottom: 8 }}>
                    <span className="is-active">Sale</span>
                    <span>Return (48h)</span>
                  </div>
                  <MockCard>
                    <MockPOSCart />
                  </MockCard>
                </div>
              </HelpScreenshot>
              <HelpScreenshot file="pos-return.png" title="POS — Return mode" urlBar="…/pos">
                <MockSidebar activeLabel="POS" />
                <div className="help-mock-main">
                  <div className="help-mock-tabs" style={{ marginBottom: 8 }}>
                    <span>Sale</span>
                    <span className="is-active">Return (48h)</span>
                  </div>
                  <MockCard>
                    <div style={{ height: 32, borderRadius: 8, background: 'var(--bg-surface-secondary)', marginBottom: 10 }} />
                    <MockTable rows={3} />
                  </MockCard>
                </div>
              </HelpScreenshot>
            </Section>
          )}

          {!isPicker && (!isAccountant || !isMarketing) && (
            <Section id="marketing" icon={<Megaphone size={22} />} title="Marketing & growth">
              <p className="help-lead">
                Coupons, hero slider, reviews, <strong>broadcasts</strong>, and <strong>delivery analytics</strong> for queued messages.
              </p>
              <JumpLink to="/marketing">Open Marketing &amp; Growth</JumpLink>
              <StepList
                items={[
                  'Broadcasts: choose channel (email / SMS / both), audience roles, then send — large sends use the background queue.',
                  'Delivery analytics: see sent / failed / pending by channel and role segment; retry failed jobs if you are admin or super.',
                ]}
              />
              <HelpScreenshot file="marketing-broadcast.png" title="Marketing — Broadcasts" urlBar="…/marketing">
                <MockSidebar activeLabel="Marketing" />
                <div className="help-mock-main">
                  <MockTabs labels={['Coupons', 'Broadcasts', 'Delivery analytics']} activeIndex={1} />
                  <MockCard>
                    <div style={{ height: 64, borderRadius: 8, background: 'var(--bg-surface-secondary)', marginBottom: 8 }} />
                    <div className="help-mock-btn-lg" style={{ opacity: 0.6 }}>Send broadcast</div>
                  </MockCard>
                </div>
              </HelpScreenshot>
              <HelpScreenshot file="marketing-analytics.png" title="Marketing — Delivery analytics" urlBar="…/marketing">
                <MockSidebar activeLabel="Marketing" />
                <div className="help-mock-main">
                  <MockTabs labels={['Coupons', 'Broadcasts', 'Delivery analytics']} activeIndex={2} />
                  <MockCard>
                    <MockTable rows={4} />
                  </MockCard>
                </div>
              </HelpScreenshot>
            </Section>
          )}

          {!isMarketing && !isPicker && (
            <Section id="customers" icon={<Users size={22} />} title="Customers">
              <p className="help-lead">Search users, adjust roles (where permitted), and review account status.</p>
              <JumpLink to="/customers">Open Customers</JumpLink>
              <StepList
                items={[
                  'Use the search field to filter by name or email.',
                  'Role changes and sensitive actions may be limited to super or admin — follow your store policy.',
                ]}
              />
              <HelpScreenshot file="customers.png" title="Customers" urlBar="…/customers">
                <MockSidebar activeLabel="Customers" />
                <div className="help-mock-main">
                  <div className="help-mock-h1" />
                  <MockCard>
                    <MockTable rows={5} />
                  </MockCard>
                </div>
              </HelpScreenshot>
            </Section>
          )}

          <Section id="alerts" icon={<Bell size={22} />} title="System alerts">
            <p className="help-lead">Security, stock, and system messages appear here. Mark as read when you have triaged them.</p>
            <JumpLink to="/notifications">Open System Alerts</JumpLink>
            <StepList
              items={[
                'Filter by type if the list is long.',
                'Low-stock and POS events often create entries here for admins.',
              ]}
            />
          </Section>

          {!isMarketing && (
            <Section id="settings" icon={<Settings size={22} />} title="Settings">
              <p className="help-lead">Branding, preferences, and staff-facing options that are not global super settings.</p>
              <JumpLink to="/settings">Open Settings</JumpLink>
              <HelpScreenshot file="settings.png" title="Settings" urlBar="…/settings">
                <MockSidebar activeLabel="Settings" />
                <div className="help-mock-main">
                  <MockCard>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[1, 2, 3, 4].map((k) => (
                        <div key={k} style={{ height: 36, borderRadius: 8, background: 'var(--bg-surface-secondary)' }} />
                      ))}
                    </div>
                  </MockCard>
                </div>
              </HelpScreenshot>
            </Section>
          )}

          {isSuper && (
            <Section id="super" icon={<ShieldAlert size={22} />} title="Super admin (Root Control)">
              <p className="help-lead">
                Global overview, admin accounts, pickup locations, logs, traffic, and super settings. Use with care — changes affect the whole site.
              </p>
              <JumpLink to="/super/dashboard">Open Global Overview</JumpLink>
              <StepList
                items={[
                  'Admin Control: create or disable staff accounts and assign roles.',
                  'System Logs & Traffic: diagnose issues and abuse patterns.',
                  'Super Settings & Pickup Locations: storefront-wide behavior and pickup points.',
                ]}
              />
              <HelpScreenshot file="super-root.png" title="Super — Global Overview" urlBar="…/super/dashboard">
                <MockSidebar activeLabel="Dashboard" />
                <div className="help-mock-main">
                  <div className="help-mock-h1" />
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-gold)', marginBottom: 8 }}>ROOT CONTROL</div>
                  <MockCard>
                    <MockStatRow />
                  </MockCard>
                </div>
              </HelpScreenshot>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
                <ExternalLink size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                For server health JSON, your team can use the API <code>status.php</code> (document separately for DevOps).
              </p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
