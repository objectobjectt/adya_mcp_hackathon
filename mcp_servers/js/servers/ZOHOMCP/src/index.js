import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

// Global variables for token management and credentials
let tokenStorage = new Map(); // Store tokens per client_id
let globalCredentials = null; // Store credentials from request body
const ZOHO_API_BASE_URL = 'https://www.zohoapis.in/crm/v2';
const REDIRECT_URI = 'http://localhost:3000/oauth/callback';

// ============================================================================
// CREDENTIAL MANAGEMENT
// ============================================================================

// Updated credential extraction function to handle the new format
function extractCredentialsFromRequest(requestBody) {
  try {
    console.log('📋 Extracting credentials from request body:', JSON.stringify(requestBody, null, 2));
    
    // Check for the new expected format first
    if (requestBody.selected_server_credentials && requestBody.selected_server_credentials.ZOHOMCP) {
      const zohoCredentials = requestBody.selected_server_credentials.ZOHOMCP;
      console.log('✅ Found credentials in selected_server_credentials.ZOHOMCP format');
      
      return {
        client_id: zohoCredentials.client_id,
        client_secret: zohoCredentials.client_secret,
        authorization_code: zohoCredentials.authorization_code || zohoCredentials.code,
        code: zohoCredentials.code || zohoCredentials.authorization_code
      };
    }
    
    // Fallback: Check for credentials in __credentials__ (legacy format)
    if (requestBody.__credentials__) {
      const creds = requestBody.__credentials__;
      console.log('⚠️  Found credentials in legacy __credentials__ format');
      
      return {
        client_id: creds.client_id,
        client_secret: creds.client_secret,
        authorization_code: creds.authorization_code || creds.code,
        code: creds.code || creds.authorization_code
      };
    }
    
    // Fallback: Direct credential structure (legacy)
    if (requestBody.client_id && requestBody.client_secret) {
      console.log('⚠️  Found credentials in direct format (legacy)');
      
      return {
        client_id: requestBody.client_id,
        client_secret: requestBody.client_secret,
        authorization_code: requestBody.authorization_code || requestBody.code,
        code: requestBody.code || requestBody.authorization_code
      };
    }
    
    console.log('❌ No valid credentials found in request body');
    return null;
  } catch (error) {
    console.error('❌ Error extracting credentials:', error);
    return null;
  }
}

function setCredentials(credentials) {
  globalCredentials = credentials;
  console.log('✅ Credentials set for client:', credentials.client_id);
}

function getCredentials() {
  if (!globalCredentials) {
    throw new Error('No credentials available. Please provide credentials in the request body under selected_server_credentials.ZOHOMCP');
  }
  return globalCredentials;
}

// ============================================================================
// OAUTH HELPER FUNCTIONS
// ============================================================================

async function getAccessTokenFromRefreshToken(clientId, clientSecret, refreshToken) {
  try {
    console.log('🔄 Refreshing access token for client:', clientId);
    
    const response = await axios.post('https://accounts.zoho.in/oauth/v2/token', null, {
      params: {
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('✅ Token refresh response:', response.data);
    
    const tokenData = {
      access_token: response.data.access_token,
      refresh_token: refreshToken,
      expires_at: Date.now() + (response.data.expires_in || 3600) * 1000,
      client_id: clientId,
      client_secret: clientSecret
    };

    tokenStorage.set(clientId, tokenData);
    return tokenData;
  } catch (error) {
    console.error('❌ Failed to refresh access token:', error.response?.data || error.message);
    throw new Error(`Token refresh failed: ${error.response?.data?.error_description || error.message}`);
  }
}

async function exchangeCodeForTokens(clientId, clientSecret, code) {
  try {
    console.log('🔄 Exchanging authorization code for tokens...');
    console.log('Using code:', code);
    
    const response = await axios.post('https://accounts.zoho.in/oauth/v2/token', null, {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('✅ Token exchange response:', response.data);
    
    const tokenData = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_at: Date.now() + (response.data.expires_in || 3600) * 1000,
      client_id: clientId,
      client_secret: clientSecret
    };

    tokenStorage.set(clientId, tokenData);
    return tokenData;
  } catch (error) {
    console.error('❌ Failed to exchange code for tokens:', error.response?.data || error.message);
    throw new Error(`Token exchange failed: ${error.response?.data?.error_description || error.message}`);
  }
}

async function getValidAccessToken(clientId, clientSecret) {
  let tokenData = tokenStorage.get(clientId);
  
  if (!tokenData) {
    return null; // No token found, need to authenticate
  }
  
  if (Date.now() >= tokenData.expires_at) {
    console.log('🔄 Token expired, refreshing...');
    try {
      tokenData = await getAccessTokenFromRefreshToken(clientId, clientSecret, tokenData.refresh_token);
    } catch (error) {
      console.log('❌ Token refresh failed, need to re-authenticate');
      return null;
    }
  }
  
  return tokenData.access_token;
}

// ============================================================================
// ZOHO API HELPER FUNCTIONS
// ============================================================================

async function makeZohoRequest(accessToken, endpoint, method = 'GET', data = null) {
  const url = `${ZOHO_API_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Zoho-oauthtoken ${accessToken}`,
    'Content-Type': 'application/json',
  };

  try {
    console.log(`🌐 Making Zoho request: ${method} ${url}`);
    
    const response = await axios({
      method,
      url,
      headers,
      data,
    });

    return response.data;
  } catch (error) {
    console.error('❌ Zoho API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: url
    });
    
    throw new Error(`Zoho API error: ${error.response?.data?.message || error.message}`);
  }
}

// ============================================================================
// CRM OPERATION FUNCTIONS
// ============================================================================

async function getRecords(accessToken, module, args = {}) {
  const { page = 1, per_page = 20, sort_order = 'desc', sort_by = 'Created_Time' } = args;
  const capitalizedModule = module.charAt(0).toUpperCase() + module.slice(1);
  
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: per_page.toString(),
    sort_order,
    sort_by,
  });

  return await makeZohoRequest(accessToken, `/${capitalizedModule}?${params}`);
}

async function createLead(accessToken, args) {
  const leadData = {
    data: [{
      Last_Name: args.last_name,
      First_Name: args.first_name,
      Email: args.email,
      Phone: args.phone,
      Company: args.company,
      Lead_Source: args.lead_source,
      Lead_Status: args.lead_status || 'Not Contacted',
    }],
  };

  return await makeZohoRequest(accessToken, '/Leads', 'POST', leadData);
}

async function createContact(accessToken, args) {
  const contactData = {
    data: [{
      Last_Name: args.last_name,
      First_Name: args.first_name,
      Email: args.email,
      Phone: args.phone,
      Account_Name: args.account_name,
    }],
  };

  return await makeZohoRequest(accessToken, '/Contacts', 'POST', contactData);
}

async function createDeal(accessToken, args) {
  const dealData = {
    data: [{
      Deal_Name: args.deal_name,
      Account_Name: args.account_name,
      Contact_Name: args.contact_name,
      Amount: args.amount,
      Closing_Date: args.closing_date,
      Stage: args.stage || 'Qualification',
      Lead_Source: args.lead_source,
      Description: args.description,
    }],
  };

  return await makeZohoRequest(accessToken, '/Deals', 'POST', dealData);
}

async function createAccount(accessToken, args) {
  const accountData = {
    data: [{
      Account_Name: args.account_name,
      Website: args.website,
      Phone: args.phone,
      Fax: args.fax,
      Industry: args.industry,
      Annual_Revenue: args.annual_revenue,
      Employees: args.employees,
      Description: args.description,
    }],
  };

  return await makeZohoRequest(accessToken, '/Accounts', 'POST', accountData);
}

async function updateRecord(accessToken, module, args) {
  const { record_id, ...updateData } = args;
  const capitalizedModule = module.charAt(0).toUpperCase() + module.slice(1);
  
  const recordData = {
    data: [{
      id: record_id,
      ...updateData
    }],
  };

  return await makeZohoRequest(accessToken, `/${capitalizedModule}`, 'PUT', recordData);
}

async function getActivities(accessToken, args = {}) {
  const { page = 1, per_page = 20, sort_order = 'desc', sort_by = 'Created_Time' } = args;
  
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: per_page.toString(),
    sort_order,
    sort_by,
  });

  return await makeZohoRequest(accessToken, `/Activities?${params}`);
}

async function searchRecords(accessToken, args) {
  const { module, criteria, page = 1, per_page = 20 } = args;
  
  const params = new URLSearchParams({
    criteria,
    page: page.toString(),
    per_page: per_page.toString(),
  });

  return await makeZohoRequest(accessToken, `/${module}/search?${params}`);
}

async function getRecord(accessToken, module, recordId) {
  const capitalizedModule = module.charAt(0).toUpperCase() + module.slice(1);
  return await makeZohoRequest(accessToken, `/${capitalizedModule}/${recordId}`);
}

async function deleteRecord(accessToken, module, recordId) {
  const capitalizedModule = module.charAt(0).toUpperCase() + module.slice(1);
  return await makeZohoRequest(accessToken, `/${capitalizedModule}/${recordId}`, 'DELETE');
}

async function convertLead(accessToken, args) {
  const { lead_id, account_name, contact_name, deal_name, amount, closing_date } = args;
  
  const conversionData = {
    data: [{
      id: lead_id,
      Account_Name: account_name,
      Contact_Name: contact_name,
      Deal_Name: deal_name,
      Amount: amount,
      Closing_Date: closing_date
    }]
  };

  return await makeZohoRequest(accessToken, '/Leads/actions/convert', 'POST', conversionData);
}

async function getRelatedRecords(accessToken, module, recordId, relatedModule) {
  const capitalizedModule = module.charAt(0).toUpperCase() + module.slice(1);
  const capitalizedRelatedModule = relatedModule.charAt(0).toUpperCase() + relatedModule.slice(1);
  
  return await makeZohoRequest(accessToken, `/${capitalizedModule}/${recordId}/${capitalizedRelatedModule}`);
}

// ============================================================================
// FUNCTION EXECUTION WRAPPER
// ============================================================================

async function executeZohoFunctionWithCredentials(functionName, args, requestBody) {
  // Extract credentials from the request body
  const credentials = extractCredentialsFromRequest(requestBody);
  
  if (!credentials || !credentials.client_id || !credentials.client_secret) {
    throw new Error('Invalid credentials format. Please provide credentials in the request body under selected_server_credentials.ZOHOMCP with client_id, client_secret, and code.');
  }
  
  // Set credentials globally
  setCredentials(credentials);
  
  const { client_id, client_secret, authorization_code, code } = credentials;
  
  // Handle authorization - automatically exchange code for tokens if provided
  const authCode = authorization_code || code;
  if (authCode) {
    try {
      console.log('🔄 Processing authorization code from request body...');
      const tokenData = await exchangeCodeForTokens(client_id, client_secret, authCode);
      console.log('✅ Authorization successful, tokens stored');
      
      // If the function is just for authentication, return the token data
      if (functionName === 'authenticate') {
        return { 
          success: true, 
          message: 'Authorization successful - tokens obtained and stored',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(tokenData.expires_at).toISOString()
        };
      }
    } catch (error) {
      throw new Error(`Authorization failed: ${error.message}`);
    }
  }
  
  // Get access token
  const accessToken = await getValidAccessToken(client_id, client_secret);
  if (!accessToken) {
    const authUrl = `https://accounts.zoho.in/oauth/v2/auth?scope=ZohoCRM.modules.ALL&client_id=${client_id}&response_type=code&access_type=offline&redirect_uri=${REDIRECT_URI}`;
    throw new Error(`Authentication required. Please visit: ${authUrl}`);
  }
  
  try {
    switch (functionName) {
      case 'get_leads':
        return await getRecords(accessToken, 'leads', args);
      case 'get_contacts':
        return await getRecords(accessToken, 'contacts', args);
      case 'get_deals':
        return await getRecords(accessToken, 'deals', args);
      case 'get_accounts':
        return await getRecords(accessToken, 'accounts', args);
      case 'create_lead':
        return await createLead(accessToken, args);
      case 'create_contact':
        return await createContact(accessToken, args);
      case 'create_deal':
        return await createDeal(accessToken, args);
      case 'create_account':
        return await createAccount(accessToken, args);
      case 'update_lead':
        return await updateRecord(accessToken, 'leads', args);
      case 'update_contact':
        return await updateRecord(accessToken, 'contacts', args);
      case 'update_deal':
        return await updateRecord(accessToken, 'deals', args);
      case 'update_account':
        return await updateRecord(accessToken, 'accounts', args);
      case 'get_activities':
        return await getActivities(accessToken, args);
      case 'search_records':
        return await searchRecords(accessToken, args);
      case 'get_record':
        return await getRecord(accessToken, args.module, args.record_id);
      case 'delete_record':
        return await deleteRecord(accessToken, args.module, args.record_id);
      case 'convert_lead':
        return await convertLead(accessToken, args);
      case 'get_related_records':
        return await getRelatedRecords(accessToken, args.module, args.record_id, args.related_module);
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  } catch (error) {
    console.error(`❌ Error executing ${functionName}:`, error);
    throw error;
  }
}

// ============================================================================
// MCP SERVER SETUP
// ============================================================================

const server = new Server(
  {
    name: 'zoho-crm-server',
    version: '1.0.0',
    description: 'MCP server for Zoho CRM integration with OAuth2 authentication',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define all available tools with updated credential format
const zohoCrmTools = [
  {
    name: 'get_leads',
    description: 'Get leads from Zoho CRM. Use this when you need to retrieve lead information. Credentials should be provided in selected_server_credentials.ZOHOMCP format.',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', description: 'Page number', default: 1 },
        per_page: { type: 'integer', description: 'Records per page', default: 20 },
        sort_order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        sort_by: { type: 'string', default: 'Created_Time' }
      }
    }
  },
  {
    name: 'get_contacts',
    description: 'Get contacts from Zoho CRM. Use this when you need to retrieve contact information. Credentials should be provided in selected_server_credentials.ZOHOMCP format.',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', default: 1 },
        per_page: { type: 'integer', default: 20 },
        sort_order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        sort_by: { type: 'string', default: 'Created_Time' }
      }
    }
  },
  {
    name: 'get_deals',
    description: 'Get deals from Zoho CRM. Use this when you need to retrieve deal information. Credentials should be provided in selected_server_credentials.ZOHOMCP format.',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', default: 1 },
        per_page: { type: 'integer', default: 20 },
        sort_order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        sort_by: { type: 'string', default: 'Created_Time' }
      }
    }
  },
  {
    name: 'get_accounts',
    description: 'Get accounts from Zoho CRM. Use this when you need to retrieve account information. Credentials should be provided in selected_server_credentials.ZOHOMCP format.',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', default: 1 },
        per_page: { type: 'integer', default: 20 },
        sort_order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        sort_by: { type: 'string', default: 'Created_Time' }
      }
    }
  },
  {
    name: 'create_lead',
    description: 'Create a new lead in Zoho CRM. Use this when you need to add a new prospect. Credentials should be provided in selected_server_credentials.ZOHOMCP format.',
    inputSchema: {
      type: 'object',
      properties: {
        first_name: { type: 'string', description: 'Lead first name' },
        last_name: { type: 'string', description: 'Lead last name (required)' },
        email: { type: 'string', description: 'Lead email address' },
        phone: { type: 'string', description: 'Lead phone number' },
        company: { type: 'string', description: 'Lead company name' },
        lead_source: { type: 'string', description: 'Source of the lead' },
        lead_status: { type: 'string', description: 'Status of the lead' }
      },
      required: ['last_name']
    }
  },
  {
    name: 'create_contact',
    description: 'Create a new contact in Zoho CRM. Use this when you need to add a new contact. Credentials should be provided in selected_server_credentials.ZOHOMCP format.',
    inputSchema: {
      type: 'object',
      properties: {
        first_name: { type: 'string', description: 'Contact first name' },
        last_name: { type: 'string', description: 'Contact last name (required)' },
        email: { type: 'string', description: 'Contact email address' },
        phone: { type: 'string', description: 'Contact phone number' },
        account_name: { type: 'string', description: 'Associated account name' }
      },
      required: ['last_name']
    }
  },
  {
    name: 'create_deal',
    description: 'Create a new deal in Zoho CRM. Use this when you need to add a new sales opportunity. Credentials should be provided in selected_server_credentials.ZOHOMCP format.',
    inputSchema: {
      type: 'object',
      properties: {
        deal_name: { type: 'string', description: 'Deal name (required)' },
        account_name: { type: 'string', description: 'Associated account name' },
        contact_name: { type: 'string', description: 'Associated contact name' },
        amount: { type: 'number', description: 'Deal amount' },
        closing_date: { type: 'string', format: 'date-time', description: 'Deal closing date' },
        stage: { type: 'string', description: 'Deal stage' },
        lead_source: { type: 'string', description: 'Source of the deal' },
        description: { type: 'string', description: 'Deal description' }
      },
      required: ['deal_name']
    }
  },
  {
    name: 'create_account',
    description: 'Create a new account in Zoho CRM. Use this when you need to add a new company/organization. Credentials should be provided in selected_server_credentials.ZOHOMCP format.',
    inputSchema: {
      type: 'object',
      properties: {
        account_name: { type: 'string', description: 'Account name (required)' },
        website: { type: 'string', description: 'Company website' },
        phone: { type: 'string', description: 'Company phone number' },
        fax: { type: 'string', description: 'Company fax number' },
        industry: { type: 'string', description: 'Company industry' },
        annual_revenue: { type: 'number', description: 'Company annual revenue' },
        employees: { type: 'integer', description: 'Number of employees' },
        description: { type: 'string', description: 'Account description' }
      },
      required: ['account_name']
    }
  },
  {
    name: 'update_lead',
    description: 'Update an existing lead in Zoho CRM. Use this when you need to modify lead information. Credentials should be provided in selected_server_credentials.ZOHOMCP format.',
    inputSchema: {
      type: 'object',
      properties: {
        record_id: { type: 'string', description: 'Lead record ID (required)' },
        first_name: { type: 'string', description: 'Lead first name' },
        last_name: { type: 'string', description: 'Lead last name' },
        email: { type: 'string', description: 'Lead email address' },
        phone: { type: 'string', description: 'Lead phone number' },
        company: { type: 'string', description: 'Lead company name' },
        lead_source: { type: 'string', description: 'Source of the lead' },
        lead_status: { type: 'string', description: 'Status of the lead' }
      },
      required: ['record_id']
    }
  },
  {
    name: 'update_contact',
    description: 'Update an existing contact in Zoho CRM. Use this when you need to modify contact information. Credentials should be provided in selected_server_credentials.ZOHOMCP format.',
    inputSchema: {
      type: 'object',
      properties: {
        record_id: { type: 'string', description: 'Contact record ID (required)' },
        first_name: { type: 'string', description: 'Contact first name' },
        last_name: { type: 'string', description: 'Contact last name' },
        email: { type: 'string', description: 'Contact email address' },
        phone: { type: 'string', description: 'Contact phone number' },
        account_name: { type: 'string', description: 'Associated account name' }
      },
      required: ['record_id']
    }
  },
  {
    name: 'update_deal',
    description: 'Update an existing deal in Zoho CRM. Use this when you need to modify deal information. Credentials should be provided in selected_server_credentials.ZOHOMCP format.',
    inputSchema: {
      type: 'object',
      properties: {
        record_id: { type: 'string', description: 'Deal record ID (required)' },
        deal_name: { type: 'string', description: 'Deal name' },
        account_name: { type: 'string', description: 'Associated account name' },
        contact_name: { type: 'string', description: 'Associated contact name' },
        amount: { type: 'number', description: 'Deal amount' },
        closing_date: { type: 'string', format: 'date-time', description: 'Deal closing date' },
        stage: { type: 'string', description: 'Deal stage' },
        lead_source: { type: 'string', description: 'Source of the deal' },
        description: { type: 'string', description: 'Deal description' }
      },
      required: ['record_id']
    }
  },
  {
    name: 'update_account',
    description: 'Update an existing account in Zoho CRM. Use this when you need to modify account information. Credentials should be provided in selected_server_credentials.ZOHOMCP format.',
    inputSchema: {
      type: 'object',
      properties: {
        record_id: { type: 'string', description: 'Account record ID (required)' },
        account_name: { type: 'string', description: 'Account name' },
        website: { type: 'string', description: 'Company website' },
        phone: { type: 'string', description: 'Company phone number' },
        fax: { type: 'string', description: 'Company fax number' },
        industry: { type: 'string', description: 'Company industry' },
        annual_revenue: { type: 'number', description: 'Company annual revenue' },
        employees: { type: 'integer', description: 'Number of employees' },
        description: { type: 'string', description: 'Account description' }
      },
      required: ['record_id']
    }
  },
  {
    name: 'get_activities',
    description: 'Get activities from Zoho CRM. Use this when you need to retrieve activity information. Credentials should be provided in selected_server_credentials.ZOHOMCP format.',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'integer', default: 1 },
        per_page: { type: 'integer', default: 20 },
        sort_order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        sort_by: { type: 'string', default: 'Created_Time' }
      }
    }
  },
  {
    name: 'search_records',
    description: 'Search for records in Zoho CRM. Use this when you need to find specific records. Credentials should be provided in selected_server_credentials.ZOHOMCP format.',
    inputSchema: {
      type: 'object',
      properties: {
        module: { type: 'string', enum: ['Leads', 'Contacts', 'Deals', 'Accounts'], description: 'Module to search in' },
        criteria: { type: 'string', description: 'Search criteria' },
        page: { type: 'integer', default: 1 },
        per_page: { type: 'integer', default: 20 }
      },
      required: ['module', 'criteria']
    }
  },
  {
    name: 'get_record',
    description: 'Get a specific record by ID from Zoho CRM. Credentials should be provided in selected_server_credentials.ZOHOMCP format.',
    inputSchema: {
      type: 'object',
      properties: {
        module: { type: 'string', enum: ['Leads', 'Contacts', 'Deals', 'Accounts'], description: 'Module to get record from' },
        record_id: { type: 'string', description: 'Record ID' }
      },
      required: ['module', 'record_id']
    }
  },
  {
    name: 'delete_record',
    description: 'Delete a record from Zoho CRM.',
    inputSchema: {
      type: 'object',
      properties: {
        module: { type: 'string', enum: ['Leads', 'Contacts', 'Deals', 'Accounts'], description: 'Module to delete record from' },
        record_id: { type: 'string', description: 'Record ID' }
      },
      required: ['module', 'record_id']
    }
  },
  {
    name: 'convert_lead',
    description: 'Convert a lead to contact, account, and deal in Zoho CRM.',
    inputSchema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string', description: 'Lead ID to convert' },
        account_name: { type: 'string', description: 'Account name for conversion' },
        contact_name: { type: 'string', description: 'Contact name for conversion' },
        deal_name: { type: 'string', description: 'Deal name for conversion' },
        amount: { type: 'number', description: 'Deal amount' },
        closing_date: { type: 'string', format: 'date-time', description: 'Deal closing date' }
      },
      required: ['lead_id']
    }
  },
  {
    name: 'get_related_records',
    description: 'Get related records for a specific record in Zoho CRM.',
    inputSchema: {
      type: 'object',
      properties: {
        module: { type: 'string', enum: ['Leads', 'Contacts', 'Deals', 'Accounts'], description: 'Module of the main record' },
        record_id: { type: 'string', description: 'Record ID' },
        related_module: { type: 'string', enum: ['Leads', 'Contacts', 'Deals', 'Accounts'], description: 'Related module to fetch' }
      },
      required: ['module', 'record_id', 'related_module']
    }
  }
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: zohoCrmTools };
});

// Call tool handler
// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'set_credentials') {
      // Set credentials from the request
      setCredentials(args);
      
      // If authorization code is provided, automatically exchange it for tokens
      const authCode = args.authorization_code || args.autharization_code;
      if (authCode) {
        try {
          const tokenData = await exchangeCodeForTokens(args.client_id, args.client_secret, authCode);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: 'Credentials set and authorization successful - tokens obtained and stored',
                  access_token: tokenData.access_token,
                  refresh_token: tokenData.refresh_token,
                  expires_at: new Date(tokenData.expires_at).toISOString()
                }, null, 2)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: `Authorization failed: ${error.message}`
                }, null, 2)
              }
            ]
          };
        }
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Credentials set successfully'
            }, null, 2)
          }
        ]
      };
    }

    if (name === 'authenticate') {
      const result = await executeZohoFunctionWithCredentials('authenticate', args, args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }

    // Handle all other Zoho CRM functions
    // ✅ Fixed: Use the correct function name and pass the request body
    const result = await executeZohoFunctionWithCredentials(name, args, args);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error.message,
            success: false
          }, null, 2)
        }
      ]
    };
  }
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  console.log('🚀 Starting Zoho CRM MCP Server...');
  
  await server.connect(transport);
  console.log('✅ Zoho CRM MCP Server is running');
}

main().catch((error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});