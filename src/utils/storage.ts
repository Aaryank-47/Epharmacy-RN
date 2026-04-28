import { createMMKV } from 'react-native-mmkv';

// Initialize the MMKV instance with a unique ID and encryption
export const storage = createMMKV({
    id: 'epharmacy-auth-storage',
    encryptionKey: 'secure-key-epharmacy-app',
});

/**
 * MMKV Storage Wrapper
 * - Synchronous (Fast)
 * - Encrypted (Secure)
 * - Type-safe wrappers
 */
export const secureStorage = {
    /**
     * Set a string value
     */
    set: (key: string, value: string) => {
        storage.set(key, value);
    },

    /**
     * Set a number value
     */
    setNumber: (key: string, value: number) => {
        storage.set(key, value);
    },

    /**
     * Set a boolean value
     */
    setBoolean: (key: string, value: boolean) => {
        storage.set(key, value);
    },

    /**
     * Get a string value
     */
    getString: (key: string): string | undefined => {
        return storage.getString(key);
    },

    /**
     * Get a number value
     */
    getNumber: (key: string): number | undefined => {
        return storage.getNumber(key);
    },

    /**
     * Get a boolean value
     */
    getBoolean: (key: string): boolean | undefined => {
        return storage.getBoolean(key);
    },

    /**
     * Delete a specific key
     */
    delete: (key: string) => {
        storage.remove(key);
    },

    /**
     * Clear all storage
     */
    clearAll: () => {
        storage.clearAll();
    },

    /**
     * Check if a key exists
     */
    contains: (key: string): boolean => {
        return storage.contains(key);
    },
};
