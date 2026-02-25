const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

export const setUserBranch = async (id, branch_id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin_customers.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'set_branch', id, branch_id }),
        });

        return await response.json();
    } catch (error) {
        console.error('Error setting user branch:', error);
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

export const getBranches = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/super_branches.php`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching branches:', error);
        throw error;
    }
};

export const addBranch = async (branchData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/super_branches.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(branchData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error adding branch:', error);
        throw error;
    }
};
