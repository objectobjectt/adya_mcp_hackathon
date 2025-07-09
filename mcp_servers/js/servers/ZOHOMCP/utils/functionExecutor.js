import { extractCredentialsFromRequest } from '../auth/creds.js';
import { tokenStorage } from '../auth/tokenManagement.js';
import { exchangeCodeForTokens, getValidAccessToken } from '../auth/oauth.js';
import { ZOHO_AUTH_URL, REDIRECT_URI } from '../config/constants.js';
import * as crmOps from '../api/crmOper.js';

export async function executeZohoFunctionWithCredentials(functionName, args, requestBody) {
    // extract creds from the request body
    let credentials = extractCredentialsFromRequest(requestBody);

    if (!credentials || !credentials.client_id || !credentials.client_secret) {
        throw new Error("Invalid credentials format. Please provide credentials in the request body under selected_server_credentials.ZOHOMCP with client_id, client_secret, and code.");
    }
    if (tokenStorage.get(credentials.client_id)) {
        console.log("🔄 Credentials already set for client:", credentials.client_id);
        credentials = tokenStorage.get(credentials.client_id);
    }

    const { client_id, client_secret, authorization_code, code } = credentials;
    const authCode = authorization_code || code;
    if (authCode) {
        try {
            console.log("🔄 Processing authorization code from request body...");
            const tokenData = await exchangeCodeForTokens(client_id, client_secret, authCode);
            console.log("✅ Authorization successful, tokens stored");
            tokenStorage.print();

            // if the function is just for authentication, return the token data
            if (functionName === "authenticate") {
                return {
                    success: true,
                    message: "Authorization successful - tokens obtained and stored",
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token,
                    expires_at: new Date(tokenData.expires_at).toISOString(),
                };
            }
        } catch (error) {
            throw new Error(`Authorization failed: ${error.message}`);
        }
    }

    // get access token
    const accessToken = await getValidAccessToken(client_id, client_secret);
    tokenStorage.print();

    if (!accessToken) {
        const authUrl = `${ZOHO_AUTH_URL}?scope=ZohoCRM.modules.ALL&client_id=${client_id}&response_type=code&access_type=offline&redirect_uri=${REDIRECT_URI}`;
        throw new Error(`Authentication required. Please visit: ${authUrl}`);
    }

    console.log("ZOHO MCP CALLED WITH FUNCTION:", functionName, "ARGS:", JSON.stringify(args, null, 2));

    try {
        switch (functionName) {
            case "get_leads":
                return await crmOps.getRecords(accessToken, "leads", args);
            case "get_contacts":
                return await crmOps.getRecords(accessToken, "contacts", args);
            case "get_deals":
                return await crmOps.getRecords(accessToken, "deals", args);
            case "get_accounts":
                return await crmOps.getRecords(accessToken, "accounts", args);
            case "create_lead":
                return await crmOps.createLead(accessToken, args);
            case "create_contact":
                return await crmOps.createContact(accessToken, args);
            case "create_deal":
                return await crmOps.createDeal(accessToken, args);
            case "create_account":
                return await crmOps.createAccount(accessToken, args);
            case "update_lead":
                return await crmOps.updateRecord(accessToken, "leads", args);
            case "update_contact":
                return await crmOps.updateRecord(accessToken, "contacts", args);
            case "update_deal":
                return await crmOps.updateRecord(accessToken, "deals", args);
            case "update_account":
                return await crmOps.updateRecord(accessToken, "accounts", args);
            case "get_activities":
                return await crmOps.getActivities(accessToken, args);
            case "search_records":
                return await crmOps.searchRecords(accessToken, args);
            case "get_record":
                return await crmOps.getRecord(accessToken, args.module, args.record_id);
            case "delete_record":
                return await crmOps.deleteRecord(accessToken, args.module, args.record_id);
            case "convert_lead":
                return await crmOps.convertLead(accessToken, args);
            case "get_related_records":
                return await crmOps.getRelatedRecords(accessToken, args.module, args.record_id, args.related_module);
            default:
                throw new Error(`Unknown function: ${functionName}`);
        }
    } catch (error) {
        console.error(`❌ Error executing ${functionName}:`, error);
        throw error;
    }
}