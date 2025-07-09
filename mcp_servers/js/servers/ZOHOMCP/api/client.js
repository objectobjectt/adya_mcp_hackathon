import axios from 'axios';
import { logger } from '../utils/logger.js';
import { ZOHO_API_BASE_URL } from '../config/constants.js';

// zoho api client
export async function makeZohoRequest(accessToken, endpoint, method = "GET", data = null) {
    const url = `${ZOHO_API_BASE_URL}${endpoint}`;
    const headers = {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json",
    };

    try {
        logger.network(`Making Zoho request: ${method} ${url}`);

        const response = await axios({
            method,
            url,
            headers,
            data,
        });

        return response.data;
    } catch (error) {
        logger.error("Zoho API Error:", {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: url,
        });

        throw new Error(`Zoho API error: ${error.response?.data?.message || error.message}`);
    }
}