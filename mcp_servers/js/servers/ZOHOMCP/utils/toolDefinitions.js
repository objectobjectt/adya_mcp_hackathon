export const zohoCrmTools = [
    {
        name: "get_leads",
        description: "Get leads from Zoho CRM. Use this when you need to retrieve lead information. Credentials should be provided in selected_server_credentials.ZOHOMCP format.",
        inputSchema: {
            type: "object",
            properties: {
                page: { type: "integer", description: "Page number", default: 1 },
                per_page: { type: "integer", description: "Records per page", default: 20 },
                sort_order: { type: "string", enum: ["asc", "desc"], default: "desc" },
                sort_by: { type: "string", default: "Created_Time" },
            },
        },
    },
    {
        name: "get_contacts",
        description: "Get contacts from Zoho CRM. Use this when you need to retrieve contact information. Credentials should be provided in selected_server_credentials.ZOHOMCP format.",
        inputSchema: {
            type: "object",
            properties: {
                page: { type: "integer", default: 1 },
                per_page: { type: "integer", default: 20 },
                sort_order: { type: "string", enum: ["asc", "desc"], default: "desc" },
                sort_by: { type: "string", default: "Created_Time" },
            },
        },
    },
    {
        name: "get_deals",
        description: "Get deals from Zoho CRM. Use this when you need to retrieve deal information. Credentials should be provided in selected_server_credentials.ZOHOMCP format.",
        inputSchema: {
            type: "object",
            properties: {
                page: { type: "integer", default: 1 },
                per_page: { type: "integer", default: 20 },
                sort_order: { type: "string", enum: ["asc", "desc"], default: "desc" },
                sort_by: { type: "string", default: "Created_Time" },
            },
        },
    },
    {
        name: "get_accounts",
        description: "Get accounts from Zoho CRM. Use this when you need to retrieve account information. Credentials should be provided in selected_server_credentials.ZOHOMCP format.",
        inputSchema: {
            type: "object",
            properties: {
                page: { type: "integer", default: 1 },
                per_page: { type: "integer", default: 20 },
                sort_order: { type: "string", enum: ["asc", "desc"], default: "desc" },
                sort_by: { type: "string", default: "Created_Time" },
            },
        },
    },
    {
        name: "create_lead",
        description: "Create a new lead in Zoho CRM. Use this when you need to add a new prospect. Credentials should be provided in selected_server_credentials.ZOHOMCP format.",
        inputSchema: {
            type: "object",
            properties: {
                first_name: { type: "string", description: "Lead first name" },
                last_name: { type: "string", description: "Lead last name (required)" },
                email: { type: "string", description: "Lead email address" },
                phone: { type: "string", description: "Lead phone number" },
                company: { type: "string", description: "Lead company name" },
                lead_source: { type: "string", description: "Source of the lead" },
                lead_status: { type: "string", description: "Status of the lead" },
            },
            required: ["last_name"],
        },
    },
    {
        name: "create_contact",
        description: "Create a new contact in Zoho CRM. Use this when you need to add a new contact. Credentials should be provided in selected_server_credentials.ZOHOMCP format.",
        inputSchema: {
            type: "object",
            properties: {
                first_name: { type: "string", description: "Contact first name" },
                last_name: { type: "string", description: "Contact last name (required)" },
                email: { type: "string", description: "Contact email address" },
                phone: { type: "string", description: "Contact phone number" },
                account_name: { type: "string", description: "Associated account name" },
            },
            required: ["last_name"],
        },
    },
    {
        name: "create_deal",
        description: "Create a new deal in Zoho CRM. Use this when you need to add a new sales opportunity. Credentials should be provided in selected_server_credentials.ZOHOMCP format.",
        inputSchema: {
            type: "object",
            properties: {
                deal_name: { type: "string", description: "Deal name (required)" },
                account_name: { type: "string", description: "Associated account name" },
                contact_name: { type: "string", description: "Associated contact name" },
                amount: { type: "number", description: "Deal amount" },
                closing_date: { type: "string", format: "date-time", description: "Deal closing date" },
                stage: { type: "string", description: "Deal stage" },
                lead_source: { type: "string", description: "Source of the deal" },
                description: { type: "string", description: "Deal description" },
            },
            required: ["deal_name"],
        },
    },
    {
        name: "create_account",
        description:
            "Create a new account in Zoho CRM. Use this when you need to add a new company/organization. Credentials should be provided in selected_server_credentials.ZOHOMCP format.",
        inputSchema: {
            type: "object",
            properties: {
                account_name: { type: "string", description: "Account name (required)" },
                website: { type: "string", description: "Company website" },
                phone: { type: "string", description: "Company phone number" },
                fax: { type: "string", description: "Company fax number" },
                industry: { type: "string", description: "Company industry" },
                annual_revenue: { type: "number", description: "Company annual revenue" },
                employees: { type: "integer", description: "Number of employees" },
                description: { type: "string", description: "Account description" },
            },
            required: ["account_name"],
        },
    },
    {
        name: "update_lead",
        description: "Update an existing lead in Zoho CRM. Use this when you need to modify lead information. Credentials should be provided in selected_server_credentials.ZOHOMCP format.",
        inputSchema: {
            type: "object",
            properties: {
                record_id: { type: "string", description: "Lead record ID (required)" },
                first_name: { type: "string", description: "Lead first name" },
                last_name: { type: "string", description: "Lead last name" },
                email: { type: "string", description: "Lead email address" },
                phone: { type: "string", description: "Lead phone number" },
                company: { type: "string", description: "Lead company name" },
                lead_source: { type: "string", description: "Source of the lead" },
                lead_status: { type: "string", description: "Status of the lead" },
            },
            required: ["record_id"],
        },
    },
    {
        name: "update_contact",
        description:
            "Update an existing contact in Zoho CRM. Use this when you need to modify contact information. Credentials should be provided in selected_server_credentials.ZOHOMCP format.",
        inputSchema: {
            type: "object",
            properties: {
                record_id: { type: "string", description: "Contact record ID (required)" },
                first_name: { type: "string", description: "Contact first name" },
                last_name: { type: "string", description: "Contact last name" },
                email: { type: "string", description: "Contact email address" },
                phone: { type: "string", description: "Contact phone number" },
                account_name: { type: "string", description: "Associated account name" },
            },
            required: ["record_id"],
        },
    },
    {
        name: "update_deal",
        description: "Update an existing deal in Zoho CRM. Use this when you need to modify deal information. Credentials should be provided in selected_server_credentials.ZOHOMCP format.",
        inputSchema: {
            type: "object",
            properties: {
                record_id: { type: "string", description: "Deal record ID (required)" },
                deal_name: { type: "string", description: "Deal name" },
                account_name: { type: "string", description: "Associated account name" },
                contact_name: { type: "string", description: "Associated contact name" },
                amount: { type: "number", description: "Deal amount" },
                closing_date: { type: "string", format: "date-time", description: "Deal closing date" },
                stage: { type: "string", description: "Deal stage" },
                lead_source: { type: "string", description: "Source of the deal" },
                description: { type: "string", description: "Deal description" },
            },
            required: ["record_id"],
        },
    },
    {
        name: "update_account",
        description:
            "Update an existing account in Zoho CRM. Use this when you need to modify account information. Credentials should be provided in selected_server_credentials.ZOHOMCP format.",
        inputSchema: {
            type: "object",
            properties: {
                record_id: { type: "string", description: "Account record ID (required)" },
                account_name: { type: "string", description: "Account name" },
                website: { type: "string", description: "Company website" },
                phone: { type: "string", description: "Company phone number" },
                fax: { type: "string", description: "Company fax number" },
                industry: { type: "string", description: "Company industry" },
                annual_revenue: { type: "number", description: "Company annual revenue" },
                employees: { type: "integer", description: "Number of employees" },
                description: { type: "string", description: "Account description" },
            },
            required: ["record_id"],
        },
    },
    {
        name: "get_activities",
        description: "Get activities from Zoho CRM. Use this when you need to retrieve activity information. Credentials should be provided in selected_server_credentials.ZOHOMCP format.",
        inputSchema: {
            type: "object",
            properties: {
                page: { type: "integer", default: 1 },
                per_page: { type: "integer", default: 20 },
                sort_order: { type: "string", enum: ["asc", "desc"], default: "desc" },
                sort_by: { type: "string", default: "Created_Time" },
            },
        },
    },
    {
        name: "search_records",
        description: "Search for records in Zoho CRM. Use this when you need to find specific records. Credentials should be provided in selected_server_credentials.ZOHOMCP format.",
        inputSchema: {
            type: "object",
            properties: {
                module: { type: "string", enum: ["Leads", "Contacts", "Deals", "Accounts"], description: "Module to search in" },
                criteria: { type: "string", description: "Search criteria" },
                page: { type: "integer", default: 1 },
                per_page: { type: "integer", default: 20 },
            },
            required: ["module", "criteria"],
        },
    },
    {
        name: "get_record",
        description: "Get a specific record by ID from Zoho CRM. Credentials should be provided in selected_server_credentials.ZOHOMCP format.",
        inputSchema: {
            type: "object",
            properties: {
                module: { type: "string", enum: ["Leads", "Contacts", "Deals", "Accounts"], description: "Module to get record from" },
                record_id: { type: "string", description: "Record ID" },
            },
            required: ["module", "record_id"],
        },
    },
    {
        name: "delete_record",
        description: "Delete a record from Zoho CRM.",
        inputSchema: {
            type: "object",
            properties: {
                module: { type: "string", enum: ["Leads", "Contacts", "Deals", "Accounts"], description: "Module to delete record from" },
                record_id: { type: "string", description: "Record ID" },
            },
            required: ["module", "record_id"],
        },
    },
    {
        name: "convert_lead",
        description: "Convert a lead to contact, account, and deal in Zoho CRM.",
        inputSchema: {
            type: "object",
            properties: {
                lead_id: { type: "string", description: "Lead ID to convert" },
                account_name: { type: "string", description: "Account name for conversion" },
                contact_name: { type: "string", description: "Contact name for conversion" },
                deal_name: { type: "string", description: "Deal name for conversion" },
                amount: { type: "number", description: "Deal amount" },
                closing_date: { type: "string", format: "date-time", description: "Deal closing date" },
            },
            required: ["lead_id"],
        },
    },
    {
        name: "get_related_records",
        description: "Get related records for a specific record in Zoho CRM.",
        inputSchema: {
            type: "object",
            properties: {
                module: { type: "string", enum: ["Leads", "Contacts", "Deals", "Accounts"], description: "Module of the main record" },
                record_id: { type: "string", description: "Record ID" },
                related_module: { type: "string", enum: ["Leads", "Contacts", "Deals", "Accounts"], description: "Related module to fetch" },
            },
            required: ["module", "record_id", "related_module"],
        },
    },
];