const API_BASE_URL = 'http://essentialshub.local/api';

/**
 * Helper to get authentication headers
 */
const getAuthHeaders = () => {
    const token = localStorage.getItem('ehub_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const loginUser = async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    const result = await response.json();
    return result;
};


export const fetchProducts = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/get_products.php?_t=${Date.now()}`);
        const result = await response.json();
        return result.success ? result.data : [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};

export const createProduct = async (productData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_products.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'create', ...productData }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || result.error || 'Failed to create product');
        }
        return result;
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }

};

export const updateProduct = async (id, productData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_products.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'update', id, ...productData }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || result.error || 'Failed to update product');
        }
        return result;
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }

};

export const deleteProduct = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_products.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'delete', id }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || result.error || 'Failed to delete product');
        }
        return result;
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }

};

export const fetchCustomers = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_customers.php?_t=${Date.now()}`, {
            headers: getAuthHeaders()
        });

        const result = await response.json();

        return result.success ? result.data : [];
    } catch (error) {
        console.error('Error fetching customers:', error);
        return [];
    }
};

export const deleteCustomer = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_customers.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'delete', id }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || result.error || 'Failed to delete customer');
        }
        return result;
    } catch (error) {
        console.error('Error deleting customer:', error);
        throw error;
    }

};

export const toggleUserRole = async (id, currentRole) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_customers.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'toggle_role', id, role: currentRole }),
        });

        return await response.json();
    } catch (error) {
        console.error('Error toggling user role:', error);
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

export const fetchSlides = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/get_slider.php`);
        const result = await response.json();
        return result.success ? result.data : [];
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

        return result.success ? result.data : [];
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

export const fetchStoreData = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_locations.php`, {
            headers: getAuthHeaders()
        });
        const result = await response.json();
        return result.success ? result : { success: false, branches: [], locations: [] };
    } catch (error) {
        console.error('Error fetching store data:', error);
        return { success: false, branches: [], locations: [] };
    }
};

export const saveProductLocation = async (locationData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_locations.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'save_location', ...locationData }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error saving product location:', error);
        throw error;
    }
};

export const deleteProductLocation = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_locations.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'delete_location', id }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting product location:', error);
        throw error;
    }
};

export const createBranch = async (branchData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_locations.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'create_branch', ...branchData }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error creating branch:', error);
        throw error;
    }
};
