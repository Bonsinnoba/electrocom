const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Helper to decode HTML entities like &gt; to >
 */
const decodeHtml = (html) => {
    if (!html) return html;
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
};

/**
 * Helper to ensure image URLs are absolute
 */
const formatImageUrl = (url) => {
    if (!url) return url;
    // Fix hardcoded dev URLs from DB
    url = url.replace('http://electrocom.local/api/', '');
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}/${url.startsWith('/') ? url.slice(1) : url}`;
};

/**
 * Helper to get authentication headers
 * Note: Authorization header is now handled implicitly via HttpOnly cookies.
 * We only need to ensure credentials: 'include' is set in fetch.
 */
const getAuthHeaders = () => {
    return {
        'Content-Type': 'application/json'
    };
};

// Global fetch options to ensure cookies are included
const getFetchOptions = (options = {}) => {
    return {
        credentials: 'include',
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...(options.headers || {})
        }
    };
};

export const fetchProducts = async (category = null) => {
    const url = category
        ? `${API_BASE_URL}/get_products.php?category=${encodeURIComponent(category)}&_t=${Date.now()}`
        : `${API_BASE_URL}/get_products.php?_t=${Date.now()}`;


    const response = await fetch(url, getFetchOptions());
    if (response.status === 503) {
        const err = new Error('Maintenance Mode');
        err.maintenance = true;
        throw err;
    }
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const result = await response.json();
    if (!result.success) throw new Error(result.message || "API error");

    const data = result.data || [];
    return data.map(product => ({
        ...product,
        name: decodeHtml(product.name),
        description: decodeHtml(product.description),
        category: decodeHtml(product.category),
        image_url: formatImageUrl(product.image_url),
        directions: formatImageUrl(product.directions), // Handles PDF uploads
        gallery: Array.isArray(product.gallery)
            ? product.gallery.map(formatImageUrl)
            : []
    }));
};

export const registerUser = async (userData) => {
    const response = await fetch(`${API_BASE_URL}/register.php`, getFetchOptions({
        method: 'POST',
        body: JSON.stringify(userData),
    }));
    if (response.status === 503) return { success: false, maintenance: true };
    return await response.json();
};

export const verifyUser = async (userId, code) => {
    const response = await fetch(`${API_BASE_URL}/verify.php`, getFetchOptions({
        method: 'POST',
        body: JSON.stringify({ user_id: userId, code }),
    }));
    return await response.json();
};

export const loginUser = async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/login.php`, getFetchOptions({
        method: 'POST',
        body: JSON.stringify(credentials),
    }));
    if (response.status === 503) return { success: false, maintenance: true };
    return await response.json();
};

export const logoutUser = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/logout.php`, getFetchOptions({
            method: 'POST'
        }));
        return await response.json();
    } catch (error) {
        console.error('Logout error:', error);
    }
};

export const forgotPassword = async (email, method = 'email') => {
    const response = await fetch(`${API_BASE_URL}/forgot_password.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, method }),
    });
    return await response.json();
};

export const resetPassword = async (resetData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/reset_password.php`, getFetchOptions({
            method: 'POST',
            body: JSON.stringify(resetData),
        }));
        if (response.status === 503) return { success: false, maintenance: true };
        return await response.json();
    } catch (error) {
        console.error('Reset password error:', error);
        throw error;
    }
};

export const updateProfile = async (profileData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/update_profile.php`, getFetchOptions({
            method: 'POST',
            body: JSON.stringify(profileData),
        }));
        if (response.status === 503) return { success: false, maintenance: true };
        return await response.json();
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};

export const createOrder = async (orderData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/orders.php`, getFetchOptions({
            method: 'POST',
            body: JSON.stringify(orderData),
        }));
        if (response.status === 503) return { success: false, maintenance: true };
        return await response.json();
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

export const fetchOrders = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/orders.php?user_id=${userId}`, getFetchOptions());
        if (response.status === 503) return []; // Silent during maintenance
        if (!response.ok) throw new Error('Failed to fetch orders');
        const result = await response.json();
        return Array.isArray(result) ? result : (result.data || []);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
};

export const fetchOrderDetails = async (orderId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/orders.php?order_id=${orderId}`, getFetchOptions());
        if (response.status === 503) throw new Error('Maintenance Mode');
        if (!response.ok) throw new Error('Failed to fetch order details');
        const result = await response.json();
        return result.success ? result.data : null;
    } catch (error) {
        console.error('Error fetching order details:', error);
        throw error;
    }
};

export const checkUserStatus = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/check_user_status.php`, getFetchOptions());
        if (response.status === 503) return { success: false, maintenance: true };
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
        const response = await fetch(`${API_BASE_URL}/delete_account.php`, getFetchOptions({
            method: 'POST'
        }));
        return await response.json();
    } catch (error) {
        console.error('Error deleting account:', error);
        throw error;
    }
};

export const getWallet = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/wallet.php`, getFetchOptions());
        if (!response.ok) throw new Error('Failed to fetch wallet info');
        return await response.json();
    } catch (error) {
        console.error('Error fetching wallet:', error);
        throw error;
    }
};

export const verifyPayment = async (reference, type = 'wallet_topup', orderId = null) => {
    try {
        const response = await fetch(`${API_BASE_URL}/verify_payment.php`, getFetchOptions({
            method: 'POST',
            body: JSON.stringify({ reference, type, order_id: orderId })
        }));
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

    if (response.status === 503) return [];
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const result = await response.json();
    const slides = result.success ? result.data : [];

    return slides.map(slide => ({
        ...slide,
        title: decodeHtml(slide.title),
        subtitle: decodeHtml(slide.subtitle),
        button_text: decodeHtml(slide.button_text),
        image_url: formatImageUrl(slide.image_url)
    }));
};
