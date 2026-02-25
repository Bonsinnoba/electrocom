const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://essentialshub.local/api';

/**
 * Helper to get authentication headers
 */
const getAuthHeaders = () => {
    const user = JSON.parse(localStorage.getItem('ehub_user') || '{}');
    const token = localStorage.getItem('ehub_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const fetchProducts = async (category = null) => {
    const url = category
        ? `${API_BASE_URL}/get_products.php?category=${encodeURIComponent(category)}&_t=${Date.now()}`
        : `${API_BASE_URL}/get_products.php?_t=${Date.now()}`;


    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const result = await response.json();
    if (!result.success) throw new Error(result.message || "API error");

    return result.data || [];
};

export const registerUser = async (userData) => {
    const response = await fetch(`${API_BASE_URL}/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    const result = await response.json();
    if (result.success && result.data.token) {
        localStorage.setItem('ehub_token', result.data.token);
    }
    return result;
};

export const verifyUser = async (userId, code) => {
    const response = await fetch(`${API_BASE_URL}/verify.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, code }),
    });
    return await response.json();
};

export const loginUser = async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    const result = await response.json();
    if (result.success && result.data.token) {
        localStorage.setItem('ehub_token', result.data.token);
    }
    return result;
};

export const updateProfile = async (profileData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/update_profile.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(profileData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};

export const createOrder = async (orderData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/orders.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(orderData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

export const fetchOrders = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/orders.php?user_id=${userId}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch orders');
        const result = await response.json();
        return Array.isArray(result) ? result : (result.data || []);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
};

export const checkUserStatus = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/check_user_status.php`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            // If 401, token might be invalid
            if (response.status === 401) return { success: false, unauthorized: true };
            return { success: false };
        }
        return await response.json();
    } catch (error) {
        console.error('Error checking user status:', error);
        return { success: false };
    }
};

export const deleteMyAccount = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/delete_account.php`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting account:', error);
        throw error;
    }
};

export const getWallet = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/wallet.php`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch wallet info');
        return await response.json();
    } catch (error) {
        console.error('Error fetching wallet:', error);
        throw error;
    }
};

export const verifyPayment = async (reference, type = 'wallet_topup', orderId = null) => {
    try {
        const response = await fetch(`${API_BASE_URL}/verify_payment.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ reference, type, order_id: orderId })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Payment verification failed');
        return result;
    } catch (error) {
        console.error('Error verifying payment:', error);
        throw error;
    }
};

export const fetchSlides = async () => {
    const response = await fetch(`${API_BASE_URL}/get_slider.php?_t=${Date.now()}`);

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const result = await response.json();
    return result.success ? result.data : [];
};
