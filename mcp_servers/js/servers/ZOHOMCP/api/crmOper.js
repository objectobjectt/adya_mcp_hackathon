import { makeZohoRequest } from './client.js';
import { DEFAULT_PAGE, DEFAULT_PER_PAGE, DEFAULT_SORT_ORDER, DEFAULT_SORT_BY } from '../config/constants.js';

export async function getRecords(accessToken, module, args = {}) {
    const { 
        page = DEFAULT_PAGE, 
        per_page = DEFAULT_PER_PAGE, 
        sort_order = DEFAULT_SORT_ORDER, 
        sort_by = DEFAULT_SORT_BY 
    } = args;
    
    const capitalizedModule = module.charAt(0).toUpperCase() + module.slice(1);

    const params = new URLSearchParams({
        page: page.toString(),
        per_page: per_page.toString(),
        sort_order,
        sort_by,
    });

    return await makeZohoRequest(accessToken, `/${capitalizedModule}?${params}`);
}

export async function createLead(accessToken, args) {
    const leadData = {
        data: [
            {
                Last_Name: args.last_name,
                First_Name: args.first_name,
                Email: args.email,
                Phone: args.phone,
                Company: args.company,
                Lead_Source: args.lead_source,
                Lead_Status: args.lead_status || "Not Contacted",
            },
        ],
    };

    return await makeZohoRequest(accessToken, "/Leads", "POST", leadData);
}

export async function createContact(accessToken, args) {
    const contactData = {
        data: [
            {
                Last_Name: args.last_name,
                First_Name: args.first_name,
                Email: args.email,
                Phone: args.phone,
                Account_Name: args.account_name,
            },
        ],
    };

    return await makeZohoRequest(accessToken, "/Contacts", "POST", contactData);
}

export async function createDeal(accessToken, args) {
    const dealData = {
        data: [
            {
                Deal_Name: args.deal_name,
                Account_Name: args.account_name,
                Contact_Name: args.contact_name,
                Amount: args.amount,
                Closing_Date: args.closing_date,
                Stage: args.stage || "Qualification",
                Lead_Source: args.lead_source,
                Description: args.description,
            },
        ],
    };

    return await makeZohoRequest(accessToken, "/Deals", "POST", dealData);
}

export async function createAccount(accessToken, args) {
    const accountData = {
        data: [
            {
                Account_Name: args.account_name,
                Website: args.website,
                Phone: args.phone,
                Fax: args.fax,
                Industry: args.industry,
                Annual_Revenue: args.annual_revenue,
                Employees: args.employees,
                Description: args.description,
            },
        ],
    };

    return await makeZohoRequest(accessToken, "/Accounts", "POST", accountData);
}

export async function updateRecord(accessToken, module, args) {
    const { record_id, ...updateData } = args;
    const capitalizedModule = module.charAt(0).toUpperCase() + module.slice(1);

    const recordData = {
        data: [
            {
                id: record_id,
                ...updateData,
            },
        ],
    };

    return await makeZohoRequest(accessToken, `/${capitalizedModule}`, "PUT", recordData);
}

export async function getActivities(accessToken, args = {}) {
    const { 
        page = DEFAULT_PAGE, 
        per_page = DEFAULT_PER_PAGE, 
        sort_order = DEFAULT_SORT_ORDER, 
        sort_by = DEFAULT_SORT_BY 
    } = args;

    const params = new URLSearchParams({
        page: page.toString(),
        per_page: per_page.toString(),
        sort_order,
        sort_by,
    });

    return await makeZohoRequest(accessToken, `/Activities?${params}`);
}

export async function searchRecords(accessToken, args) {
    const { module, criteria, page = DEFAULT_PAGE, per_page = DEFAULT_PER_PAGE } = args;

    const params = new URLSearchParams({
        criteria,
        page: page.toString(),
        per_page: per_page.toString(),
    });

    return await makeZohoRequest(accessToken, `/${module}/search?${params}`);
}

export async function getRecord(accessToken, module, recordId) {
    const capitalizedModule = module.charAt(0).toUpperCase() + module.slice(1);
    return await makeZohoRequest(accessToken, `/${capitalizedModule}/${recordId}`);
}

export async function deleteRecord(accessToken, module, recordId) {
    const capitalizedModule = module.charAt(0).toUpperCase() + module.slice(1);
    return await makeZohoRequest(accessToken, `/${capitalizedModule}/${recordId}`, "DELETE");
}

export async function convertLead(accessToken, args) {
    const { lead_id, account_name, contact_name, deal_name, amount, closing_date } = args;

    const conversionData = {
        data: [
            {
                id: lead_id,
                Account_Name: account_name,
                Contact_Name: contact_name,
                Deal_Name: deal_name,
                Amount: amount,
                Closing_Date: closing_date,
            },
        ],
    };

    return await makeZohoRequest(accessToken, "/Leads/actions/convert", "POST", conversionData);
}

export async function getRelatedRecords(accessToken, module, recordId, relatedModule) {
    const capitalizedModule = module.charAt(0).toUpperCase() + module.slice(1);
    const capitalizedRelatedModule = relatedModule.charAt(0).toUpperCase() + relatedModule.slice(1);

    return await makeZohoRequest(accessToken, `/${capitalizedModule}/${recordId}/${capitalizedRelatedModule}`);
}