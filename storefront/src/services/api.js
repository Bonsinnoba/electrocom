import { secureStorage } from '../utils/secureStorage';

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
export const formatImageUrl = (url) => {
    if (!url) return url;
    // Fix hardcoded dev URLs from DB
    const cleaningBases = [
        'http://localhost:8000/api/',
        'http://localhost:8000/',
        'http://127.0.0.1:8000/api/',
        'http://127.0.0.1:8000/',
        'http://electrocom.local/api/',
        'http://electrocom.local/',
        'https://electrocom.local/api/',
        'https://electrocom.local/'
    ];
    cleaningBases.forEach(base => {
        url = url.replace(base, '');
    });
    
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}/${url.startsWith('/') ? url.slice(1) : url}`;
};

/**
 * Helper to get authentication headers
 * Adds X-Session-Token as a robust fallback for cross-origin cookie issues.
 */
const getAuthHeaders = () => {
    const token = secureStorage.getItem('token', 'shared');
    return {
        'Content-Type': 'application/json',
        'X-App-ID': 'storefront',
        ...(token ? { 'X-Session-Token': token } : {})
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

/**
 * Global fetch wrapper that passively intercepts 401 Unauthorized responses
 * and triggers a global logout event instead of relying on wasteful 10-second background polling.
 */
const apiFetch = async (url, options = {}) => {
    const response = await fetch(url, options);
    if (response.status === 401) {
        window.dispatchEvent(new Event('auth_unauthorized'));
    }
    return response;
};

export const fetchProducts = async (category = null) => {
    const url = category
        ? `${API_BASE_URL}/get_products.php?category=${encodeURIComponent(category)}`
        : `${API_BASE_URL}/get_products.php`;

    const response = await apiFetch(url, getFetchOptions());
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
        image: formatImageUrl(product.image_url),
        image_url: formatImageUrl(product.image_url),
        directions: formatImageUrl(product.directions), // Handles PDF uploads
        gallery: Array.isArray(product.gallery)
            ? product.gallery.map(formatImageUrl)
            : []
    }));
};

export const registerUser = async (userData) => {
    const response = await apiFetch(`${API_BASE_URL}/register.php`, getFetchOptions({
        method: 'POST',
        body: JSON.stringify(userData),
    }));
    if (response.status === 503) return { success: false, maintenance: true };
    return await response.json();
};

export const verifyUser = async (userId, code) => {
    const response = await apiFetch(`${API_BASE_URL}/verify.php`, getFetchOptions({
        method: 'POST',
        body: JSON.stringify({ user_id: userId, code }),
    }));
    return await response.json();
};

export const loginUser = async (credentials) => {
    const response = await apiFetch(`${API_BASE_URL}/login.php`, getFetchOptions({
        method: 'POST',
        body: JSON.stringify(credentials),
    }));
    if (response.status === 503) return { success: false, maintenance: true };
    return await response.json();
};

export const logoutUser = async () => {
    try {
        const response = await apiFetch(`${API_BASE_URL}/logout.php`, getFetchOptions({
            method: 'POST'
        }));
        return await response.json();
    } catch (error) {
        console.error('Logout error:', error);
    }
};

export const forgotPassword = async (email, method = 'email') => {
    const response = await apiFetch(`${API_BASE_URL}/forgot_password.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, method }),
    });
    return await response.json();
};

export const changePassword = async (currentPassword, newPassword) => {
    try {
        const response = await apiFetch(`${API_BASE_URL}/change_password.php`, getFetchOptions({
            method: 'POST',
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        }));
        return await response.json();
    } catch (error) {
        console.error('Change password error:', error);
        throw error;
    }
};

export const resetPassword = async (resetData) => {
    try {
        const response = await apiFetch(`${API_BASE_URL}/reset_password.php`, getFetchOptions({
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
        const response = await apiFetch(`${API_BASE_URL}/update_profile.php`, getFetchOptions({
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
        const response = await apiFetch(`${API_BASE_URL}/orders.php`, getFetchOptions({
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
        const response = await apiFetch(`${API_BASE_URL}/orders.php?user_id=${userId}`, getFetchOptions());
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
        const response = await apiFetch(`${API_BASE_URL}/orders.php?order_id=${orderId}`, getFetchOptions());
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
        const response = await apiFetch(`${API_BASE_URL}/check_user_status.php`, getFetchOptions());
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
        const response = await apiFetch(`${API_BASE_URL}/delete_account.php`, getFetchOptions({
            method: 'POST'
        }));
        return await response.json();
    } catch (error) {
        console.error('Error deleting account:', error);
        throw error;
    }
};

export const fetchTransactions = async () => {
    try {
        const response = await apiFetch(`${API_BASE_URL}/get_transactions.php`, getFetchOptions());
        if (response.status === 503) return { success: false, maintenance: true };
        return await response.json();
    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
    }
};

export const verifyPayment = async (reference, type = 'wallet_topup', orderId = null) => {
    try {
        const response = await apiFetch(`${API_BASE_URL}/verify_payment.php`, getFetchOptions({
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
    const response = await apiFetch(`${API_BASE_URL}/get_slider.php`);

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

// --- Reviews ---
export const fetchProductReviews = async (productId) => {
    try {
        const response = await apiFetch(`${API_BASE_URL}/reviews.php?product_id=${productId}`);
        if (!response.ok) throw new Error('Failed to fetch reviews');
        const result = await response.json();
        return result.success ? result.data : { reviews: [], average_rating: 0, total_reviews: 0 };
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return { reviews: [], average_rating: 0, total_reviews: 0 };
    }
};

export const submitReview = async (productId, rating, comment) => {
    const response = await apiFetch(`${API_BASE_URL}/reviews.php`, getFetchOptions({
        method: 'POST',
        body: JSON.stringify({ product_id: productId, rating, comment }),
    }));
    return await response.json();
};

// --- Invoice ---
export const getInvoiceUrl = (orderId) => {
    return `${API_BASE_URL}/invoice.php?order_id=${orderId}`;
};

// --- Coupons ---
export const validateCoupon = async (code, cartTotal) => {
    const response = await apiFetch(`${API_BASE_URL}/coupons.php?action=validate`, getFetchOptions({
        method: 'POST',
        body: JSON.stringify({ code, cartTotal })
    }));
    return await response.json();
};


// --- Wishlist ---
export const fetchWishlist = async () => {
    try {
        const response = await apiFetch(`${API_BASE_URL}/wishlist.php`, getFetchOptions());
        if (!response.ok) throw new Error('Failed to fetch wishlist');
        const result = await response.json();
        const items = result.success ? result.items : [];
        return items.map(product => ({
            ...product,
            name: decodeHtml(product.name),
            category: decodeHtml(product.category),
            image: formatImageUrl(product.image),
            image_url: formatImageUrl(product.image)
        }));
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        return [];
    }
};

export const addToWishlist = async (productId) => {
    const response = await apiFetch(`${API_BASE_URL}/wishlist.php`, getFetchOptions({
        method: 'POST',
        body: JSON.stringify({ product_id: productId })
    }));
    return await response.json();
};

export const removeFromWishlist = async (productId) => {
    const response = await apiFetch(`${API_BASE_URL}/wishlist.php`, getFetchOptions({
        method: 'DELETE',
        body: JSON.stringify({ product_id: productId })
    }));
    return await response.json();
};

// --- Cart ---
export const syncCart = async (cartItems) => {
    try {
        const response = await apiFetch(`${API_BASE_URL}/cart_sync.php`, getFetchOptions({
            method: 'POST',
            body: JSON.stringify({ cart: cartItems })
        }));
        return await response.json();
    } catch (error) {
        // Silently fail for background cart syncs
        return { success: false };
    }
};

// --- Order Tracking ---
export const trackOrder = async (orderId, email) => {
    try {
        const response = await apiFetch(`${API_BASE_URL}/track_order.php?order_id=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}`, getFetchOptions());
        return await response.json();
    } catch (error) {
        console.error('Error tracking order:', error);
        return { success: false, error: 'Network error preventing order tracking.' };
    }
};

export const fetchSiteSettings = async () => {
    try {
        const response = await apiFetch(`${API_BASE_URL}/get_site_settings.php`);
        const result = await response.json();
        return result.success ? result.data : null;
    } catch (error) {
        console.error('Error fetching site settings:', error);
        return null;
    }
};

export const getShippingFee = async (region, subtotal) => {
    try {
        const response = await apiFetch(`${API_BASE_URL}/fetch_shipping.php`, getFetchOptions({
            method: 'POST',
            body: JSON.stringify({ region, subtotal })
        }));
        return await response.json();
    } catch (error) {
        console.error('Error fetching shipping fee:', error);
        return { success: false, fee: 0 };
    }
};
