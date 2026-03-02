/**
 * secureStorage.js
 * A wrapper for localStorage that provides user-scoping and basic obfuscation.
 * While real encryption is possible, this layer focuses on architectural separation
 * and preventing simple plain-text inspection of metadata.
 */

const APP_PREFIX = 'ehub_v3';

// Simple obfuscation to prevent plain-text "shoulder surfing"
const obfuscate = (str) => {
    if (!str) return str;
    try {
        return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
        return str;
    }
};

const deobfuscate = (str) => {
    if (!str) return str;
    try {
        return decodeURIComponent(escape(atob(str)));
    } catch (e) {
        return str;
    }
};

export const secureStorage = {
    /**
     * Set a value in storage, scoped specifically to the current user.
     */
    setItem: (key, value, userId = 'guest') => {
        const fullKey = `${APP_PREFIX}_${key}_${userId}`;
        const stringValue = JSON.stringify(value);
        localStorage.setItem(fullKey, obfuscate(stringValue));
    },

    /**
     * Get a value from storage for the current user.
     */
    getItem: (key, userId = 'guest') => {
        const fullKey = `${APP_PREFIX}_${key}_${userId}`;
        const saved = localStorage.getItem(fullKey);
        if (!saved) return null;
        try {
            return JSON.parse(deobfuscate(saved));
        } catch (e) {
            console.error(`Failed to parse secure storage for ${key}`, e);
            return null;
        }
    },

    /**
     * Remove a specific key for the user.
     */
    removeItem: (key, userId = 'guest') => {
        const fullKey = `${APP_PREFIX}_${key}_${userId}`;
        localStorage.removeItem(fullKey);
    },

    /**
     * Clear generic app data (not recommended unless full reset).
     */
    clear: () => {
        // We only clear keys starting with our prefix to avoid touching other app data
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(APP_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }
};
