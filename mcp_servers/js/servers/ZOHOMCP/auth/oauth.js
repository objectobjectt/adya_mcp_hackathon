import axios from 'axios';
import { logger } from '../utils/logger.js';
import { tokenStorage } from './tokenManagement.js';
import { ZOHO_TOKEN_URL, REDIRECT_URI } from '../config/constants.js';

// oAuth helper func
export async function getAccessTokenFromRefreshToken(clientId, clientSecret, refreshToken) {
    try {
        logger.loading("Refreshing access token for client:", clientId);

        const response = await axios.post(ZOHO_TOKEN_URL, null, {
            params: {
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: "refresh_token",
            },
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        logger.success("Token refresh response:", JSON.stringify(response.data, null, 2));

        const tokenData = {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            expires_at: Date.now() + (response.data.expires_in || 3600) * 1000,
            client_id: clientId,
            client_secret: clientSecret,
        };

        tokenStorage.set(clientId, tokenData);
        return tokenData;
    } catch (error) {
        logger.error("Failed to refresh access token:", error.response?.data || error.message);
        throw new Error(`Token refresh failed: ${error.response?.data?.error_description || error.message}`);
    }
}

export async function exchangeCodeForTokens(clientId, clientSecret, code) {
    try {
        logger.loading("Exchanging authorization code for tokens...");
        logger.info("Using code:", code);

        const response = await axios.post(ZOHO_TOKEN_URL, null, {
            params: {
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: "authorization_code",
                code: code,
                redirect_uri: REDIRECT_URI,
            },
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        logger.success("Token exchange response:", JSON.stringify(response.data, null, 2));

        if ("error" in response.data) {
            logger.error("Error in token exchange response:", response.data.error);
            throw new Error(`Token exchange failed: ${response.data.error}`);
        }

        const tokenData = {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            expires_at: Date.now() + (response.data.expires_in || 3600) * 1000,
            client_id: clientId,
            client_secret: clientSecret,
        };

        tokenStorage.set(clientId, tokenData);
        return tokenData;
    } catch (error) {
        logger.error("Failed to exchange code for tokens:", error.response?.data || error.message);
        throw new Error(`Token exchange failed: ${error.response?.data?.error_description || error.message}`);
    }
}

export async function getValidAccessToken(clientId, clientSecret) {
    let tokenData = tokenStorage.get(clientId);

    if (!tokenData) {
        return null; // no token found need for authentication
    }

    if (tokenStorage.isTokenExpired(clientId)) {
        logger.loading("Token expired, refreshing...");
        try {
            tokenData = await getAccessTokenFromRefreshToken(clientId, clientSecret, tokenData.refresh_token);
        } catch (error) {
            logger.error("Token refresh failed, need to re-authenticate");
            throw new Error(`Token refresh failed: ${error.message} ${tokenData}`);
        }
    }

    return tokenData.access_token;
}