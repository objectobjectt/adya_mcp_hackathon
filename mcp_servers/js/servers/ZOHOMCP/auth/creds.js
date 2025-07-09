import { logger } from '../utils/logger.js';
import { tokenStorage } from './tokenManagement.js';

// creds extraction and management func
export function extractCredentialsFromRequest(requestBody) {
    try {
        logger.clipboard("Extracting credentials from request body:", JSON.stringify(requestBody, null, 2));
        if (requestBody.selected_server_credentials && requestBody.selected_server_credentials.ZOHOMCP) {
            const zohoCredentials = requestBody.selected_server_credentials.ZOHOMCP;
            logger.success("Found credentials in selected_server_credentials.ZOHOMCP format");

            return {
                client_id: zohoCredentials.client_id,
                client_secret: zohoCredentials.client_secret,
                authorization_code: zohoCredentials.authorization_code || zohoCredentials.code,
                code: zohoCredentials.code || zohoCredentials.authorization_code,
            };
        }
        if (requestBody.__credentials__) {
            const creds = requestBody.__credentials__;
            logger.warning("Found credentials in legacy __credentials__ format");

            return {
                client_id: creds.client_id,
                client_secret: creds.client_secret,
                authorization_code: creds.authorization_code || creds.code,
                code: creds.code || creds.authorization_code,
            };
        }

        // Fallback: Direct credential structure (legacy)
        if (requestBody.client_id && requestBody.client_secret) {
            logger.warning("Found credentials in direct format (legacy)");

            return {
                client_id: requestBody.client_id,
                client_secret: requestBody.client_secret,
                authorization_code: requestBody.authorization_code || requestBody.code,
                code: requestBody.code || requestBody.authorization_code,
            };
        }

        logger.error("No valid credentials found in request body");
        return null;
    } catch (error) {
        logger.error("Error extracting credentials:", error);
        return null;
    }
}

export function setCredentials(credentials) {
    tokenStorage.set(credentials.client_id, credentials);
    tokenStorage.print();
}

export function getCredentials() {
    throw new Error("No credentials available. Please provide credentials in the request body under selected_server_credentials.ZOHOMCP");
}