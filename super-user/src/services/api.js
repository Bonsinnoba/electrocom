// ─── Super User API Service ────────────────────────────────────────────────────
// Central service layer for all API communication in the Super User panel.
// All requests automatically attach the super_token for authentication.
// ──────────────────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost/EssentialsHub-project/api';

/**
 * Core fetch wrapper — injects auth headers and normalises responses.
 */
async function request(endpoint, options = {}) {
    const token = localStorage.getItem('super_token');
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
        ...options,
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || data.error || 'Request failed');
    }
    return data;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboard = () => request('/super_dashboard.php');

// ─── Users / Admins ────────────────────────────────────────────────────────────
export const getUsers = () => request('/admin_customers.php');
export const deleteUser = (id) => request('/admin_customers.php', { method: 'POST', body: JSON.stringify({ action: 'delete', id }) });
export const toggleRole = (id, role) => request('/admin_customers.php', { method: 'POST', body: JSON.stringify({ action: 'toggle_role', id, role }) });
export const toggleStatus = (id, status) => request('/admin_customers.php', { method: 'POST', body: JSON.stringify({ action: 'toggle_status', id, status }) });

// ─── Products ─────────────────────────────────────────────────────────────────
export const getProducts = () => request('/admin_products.php');
export const deleteProduct = (id) => request('/admin_products.php', { method: 'DELETE', body: JSON.stringify({ id }) });

// ─── Orders ───────────────────────────────────────────────────────────────────
export const getOrders = () => request('/admin_orders.php');
export const updateOrderStatus = (id, status) => request('/admin_orders.php', { method: 'POST', body: JSON.stringify({ action: 'update_status', id, status }) });

// ─── Logs (super_logs.php) ────────────────────────────────────────────────────
export const getLogs = () => request('/super_logs.php');
export const clearLogs = () => request('/super_logs.php', { method: 'POST', body: JSON.stringify({ action: 'clear' }) });

// ─── Settings (super_settings.php) ───────────────────────────────────────────
export const getSettings = () => request('/super_settings.php');
export const saveSettings = (payload) => request('/super_settings.php', { method: 'POST', body: JSON.stringify(payload) });
