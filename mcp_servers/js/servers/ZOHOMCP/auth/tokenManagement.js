import { logger } from '../utils/logger.js';

// token storage manager
export const tokenStorage = {
    storage: {},
    
    set(clientId, data) {
        this.storage[clientId] = { ...data };
        logger.success("Credentials set for client:", clientId);
    },
    
    get(clientId) {
        return this.storage[clientId];
    },
    
    has(clientId) {
        return !!this.storage[clientId];
    },
    
    remove(clientId) {
        delete this.storage[clientId];
        logger.info("Credentials removed for client:", clientId);
    },
    
    clear() {
        this.storage = {};
        logger.info("All credentials cleared");
    },
    
    print() {
        logger.info("Current token storage:", JSON.stringify(this.storage, null, 2));
    },
    
    // Check if token is expired
    isTokenExpired(clientId) {
        const tokenData = this.get(clientId);
        if (!tokenData || !tokenData.expires_at) {
            return true;
        }
        return Date.now() >= tokenData.expires_at;
    }
};