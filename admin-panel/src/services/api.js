export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
 */
const getAuthHeaders = (contentType = 'application/json') => {
    const token = localStorage.getItem('ehub_token');
    const headers = {
        'X-App-ID': 'admin',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    if (contentType) {
        headers['Content-Type'] = contentType;
    }
    return headers;
};

/**
 * Helper to fetch with auth headers and global interceptor
 */
const authFetch = async (url, options = {}) => {
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers: {
                ...getAuthHeaders(),
                ...options.headers
            }
        });

        // Passive interceptor for 401/403
        if (response.status === 401 || response.status === 403) {
            window.dispatchEvent(new Event('auth_unauthorized'));
        }

        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('Invalid JSON response from server:', text);
            return { success: false, message: 'Server returned an invalid response.' };
        }
    } catch (error) {
        console.error('Network error during authFetch:', error);
        return { success: false, message: 'Network connection error.' };
    }
};

export const loginUser = async (credentials) => {
    try {
        const response = await fetch(`${API_BASE_URL}/login.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
            credentials: 'include' // Ensure cookies are sent and handled correctly for CORS
        });
        
        const rawText = await response.text();
        try {
            return JSON.parse(rawText);
        } catch (e) {
            console.error('Invalid JSON from server:', rawText);
            return { success: false, message: 'Server returned an invalid format.' };
        }
    } catch (error) {
        console.error('Login fetch error:', error);
        throw error; // Rethrow so Login.jsx catch block can show "Connection error"
    }
};


export const fetchProducts = async () => {
    try {
        const result = await authFetch(`/get_products.php?_t=${Date.now()}`);
        const data = result.success ? result.data : [];
        return data.map(product => ({
            ...product,
            name: decodeHtml(product.name),
            description: decodeHtml(product.description),
            category: decodeHtml(product.category),
            image_url: formatImageUrl(product.image_url),
            directions: formatImageUrl(product.directions),
            gallery: Array.isArray(product.gallery)
                ? product.gallery.map(formatImageUrl)
                : []
        }));
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};

export const createProduct = async (productData) => authFetch('/admin_products.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'create', ...productData }),
});

export const updateProduct = async (id, productData) => authFetch('/admin_products.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'update', id, ...productData }),
});

export const deleteProduct = async (id) => authFetch('/admin_products.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', id }),
});

export const fetchCustomers = async () => {
    try {
        const result = await authFetch(`/admin_customers.php?_t=${Date.now()}`);
        const data = result.success ? result.data : [];

        return data.map(customer => ({
            ...customer,
            name: decodeHtml(customer.name),
            email: decodeHtml(customer.email)
        }));
    } catch (error) {
        console.error('Error fetching customers:', error);
        return [];
    }
};

export const deleteUser = async (id) => authFetch('/admin_customers.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', id })
});
export const fetchAnalytics = async () => authFetch('/admin_analytics.php');

// --- CMS ---
export const fetchCMSPages = async () => authFetch('/cms.php?all=1');
export const getCMSPage = async (slug) => authFetch(`/cms.php?slug=${slug}`);
export const saveCMSPage = async (pageData) => authFetch('/cms.php', { method: 'POST', body: JSON.stringify(pageData) });
export const deleteCMSPage = async (id) => authFetch(`/cms.php?id=${id}`, { method: 'DELETE' });

// deleteCustomer is kept as a backward-compat alias for deleteUser
export const deleteCustomer = deleteUser;
export const setUserRole = async (id, role) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_customers.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'set_role', id, role }),
        });

        return await response.json();
    } catch (error) {
        console.error('Error setting user role:', error);
        throw error;
    }
};


export const toggleUserStatus = async (id, currentStatus) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_customers.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'toggle_status', id, status: currentStatus }),
        });

        return await response.json();
    } catch (error) {
        console.error('Error toggling user status:', error);
        throw error;
    }
};

export const fetchOrders = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_orders.php?_t=${Date.now()}`, {
            headers: getAuthHeaders()
        });

        const result = await response.json();

        return result.success ? result.data : [];
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
};

export const fetchReturns = async () => authFetch('/admin_returns.php');
export const processReturn = async (returnData) => authFetch('/admin_returns.php', { 
    method: 'POST', 
    body: JSON.stringify(returnData) 
});

export const updateOrderStatus = async (id, status) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_orders.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'update_status', id, status }),
        });

        return await response.json();
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
};

export const updatePickerOrderStage = async (id, stage) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_orders.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'picker_update', id, stage }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating picker order stage:', error);
        throw error;
    }
};

export const resendReceipt = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_orders.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'resend_receipt', id }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error resending receipt:', error);
        throw error;
    }
};

export const verifyDelivery = async (id, otp) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_orders.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'verify_delivery', id, otp }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error verifying delivery:', error);
        throw error;
    }
};

export const sendBroadcast = async (broadcastData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_broadcast.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(broadcastData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error sending broadcast:', error);
        throw error;
    }
};

export const fetchSlides = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/get_slider.php`);
        const result = await response.json();
        const slides = result.success ? result.data : [];
        return slides.map(slide => ({
            ...slide,
            title: decodeHtml(slide.title),
            subtitle: decodeHtml(slide.subtitle),
            button_text: decodeHtml(slide.button_text),
            image_url: formatImageUrl(slide.image_url)
        }));
    } catch (error) {
        console.error('Error fetching slides:', error);
        return [];
    }
};

export const fetchAdminSlides = async () => {
    try {
        // Typically admin needs all slides (including inactive)
        const response = await fetch(`${API_BASE_URL}/admin_slider.php?_t=${Date.now()}`, {
            headers: getAuthHeaders()
        });

        const result = await response.json();

        const slides = result.success ? result.data : [];
        return slides.map(slide => ({
            ...slide,
            title: decodeHtml(slide.title),
            subtitle: decodeHtml(slide.subtitle),
            button_text: decodeHtml(slide.button_text),
            image_url: formatImageUrl(slide.image_url)
        }));
    } catch (error) {
        console.error('Error fetching admin slides:', error);
        return [];
    }
};

export const createSlide = async (slideData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_slider.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'create', ...slideData }),
        });

        return await response.json();
    } catch (error) {
        console.error('Error creating slide:', error);
        throw error;
    }
};

export const updateSlide = async (id, slideData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_slider.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'update', id, ...slideData }),
        });

        return await response.json();
    } catch (error) {
        console.error('Error updating slide:', error);
        throw error;
    }
};

export const deleteSlide = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_slider.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'delete', id }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || result.error || 'Failed to delete slide');
        }
        return result;
    } catch (error) {
        console.error('Error deleting slide:', error);
        throw error;
    }

};

// ─── Super User Endpoints ─────────────────────────────────────────────────────

export const fetchSuperDashboard = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/super_dashboard.php`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching super dashboard:', error);
        throw error;
    }
};

export const fetchLogs = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/super_logs.php`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching logs:', error);
        throw error;
    }
};

export const clearLogs = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/super_logs.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'clear' }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error clearing logs:', error);
        throw error;
    }
};

export const deleteLogDay = async (dateStr) => {
    try {
        const response = await fetch(`${API_BASE_URL}/super_logs.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'delete_day', date: dateStr }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting log day:', error);
        throw error;
    }
};

export const fetchSuperSettings = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/super_settings.php`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching super settings:', error);
        throw error;
    }
};

export const saveSuperSettings = async (payload) => {
    try {
        const response = await fetch(`${API_BASE_URL}/super_settings.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        return await response.json();
    } catch (error) {
        console.error('Error saving super settings:', error);
        throw error;
    }
};

export const uploadBrandingAsset = async (file, type, oldPath = '') => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        formData.append('oldPath', oldPath);

        const response = await fetch(`${API_BASE_URL}/upload_branding.php`, {
            method: 'POST',
            headers: getAuthHeaders(null),
            body: formData,
        });
        return await response.json();
    } catch (error) {
        console.error('Error uploading branding asset:', error);
        throw error;
    }
};

export const fetchTrafficStats = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_traffic.php?action=stats`, {
            headers: getAuthHeaders()
        });
        const result = await response.json();
        return result.success ? result.data : null;
    } catch (error) {
        console.error('Error fetching traffic stats:', error);
        throw error;
    }
};

export const addRestriction = async (restrictionData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_traffic.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'add_restriction', ...restrictionData }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error adding restriction:', error);
        throw error;
    }
};

export const removeRestriction = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_traffic.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'remove_restriction', id }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error removing restriction:', error);
        throw error;
    }
};

export const clearTrafficHour = async (hour) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_traffic.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'clear_hour', hour }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error clearing traffic hour:', error);
        throw error;
    }
};

export const wipeDemoData = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/cleanup_demo.php`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        console.error('Error wiping demo data:', error);
        throw error;
    }
};

export const fetchBackups = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/super_backup.php?action=list`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching backups:', error);
        throw error;
    }
};

export const createBackup = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/super_backup.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'create' }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error creating backup:', error);
        throw error;
    }
};

export const deleteBackup = async (filename) => {
    try {
        const response = await fetch(`${API_BASE_URL}/super_backup.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'delete', file: filename }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting backup:', error);
        throw error;
    }
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
        return { success: false, message: 'Network error.' };
    }
};

// --- Reviews ---
export const fetchAllReviews = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_reviews.php?_t=${Date.now()}`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return { success: false, data: [] };
    }
};

export const deleteReview = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_reviews.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'delete', id })
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting review:', error);
        throw error;
    }
};

export const fetchAbandonedCarts = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_abandoned_carts.php?_t=${Date.now()}`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching abandoned carts:', error);
        return { success: false, data: [] };
    }
};

// --- Notifications ---



export const fetchAdminNotifications = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/get_notifications.php?admin=true&_t=${Date.now()}`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching admin notifications:', error);
        return { success: false, data: [] };
    }
};

export const markNotificationRead = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/get_notifications.php?action=mark_read`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id })
        });
        return await response.json();
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};


export const fetchBackend = authFetch;

// --- Pickup Locations (Super Admin) ---
export const fetchPickupLocationsAdmin = async () => authFetch('/admin_pickup_locations.php');

export const createPickupLocation = async (payload) => authFetch('/admin_pickup_locations.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'create', ...payload })
});

export const updatePickupLocation = async (payload) => authFetch('/admin_pickup_locations.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'update', ...payload })
});

export const deletePickupLocation = async (id) => authFetch('/admin_pickup_locations.php', {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', id })
});

