# 🧠 Zoho CRM MCP Server Overview

## 🔍 What is the Zoho CRM MCP Server?
The **Zoho CRM MCP Server** is a connector module in the Vanij Platform that enables seamless interaction with **Zoho CRM** via its OAuth2-secured API. It allows automated retrieval and management of CRM entities like leads, contacts, accounts, deals, activities, and more.

---

## 🚀 Key Features

- ✅ Fetch and manage **Leads**, **Contacts**, **Deals**, and **Accounts**
- ✅ Create, update, delete CRM records programmatically
- ✅ Search and retrieve records by custom criteria
- ✅ Convert leads to deals with related contacts/accounts
- ✅ Fetch related records and activity timelines
- ✅ Integrated OAuth2 authentication and token refresh

---

## 📦 Capabilities

| Capability           | Description                                          |
|----------------------|------------------------------------------------------|
| Lead Management      | Create, update, retrieve, delete, convert leads      |
| Contact Management   | Manage customer contact data                         |
| Deal Pipeline        | Track opportunities and sales pipelines              |
| Account Management   | Manage organizations or companies                    |
| Activity Tracking    | Retrieve meetings, tasks, and events                 |
| Record Search        | Search CRM data across modules using criteria        |
| Record Linking       | Fetch related records from other modules             |

---

## 🛠️ Tool Categories

### 📁 **Retrieval Tools**
- `get_leads` – Fetch list of leads
- `get_contacts` – Fetch customer contacts
- `get_deals` – Fetch sales opportunities
- `get_accounts` – Fetch account/organization details
- `get_activities` – Get tasks, meetings, and activities
- `get_record` – Fetch a single record by ID
- `get_related_records` – Fetch related records across modules

### 🔍 **Search Tools**
- `search_records` – Search using field-level criteria (e.g. email, phone)

### ✏️ **Create Tools**
- `create_lead` – Add a new prospect
- `create_contact` – Add a new customer contact
- `create_deal` – Add a new deal
- `create_account` – Add a new company/account

### 🔄 **Update Tools**
- `update_lead` – Modify existing lead
- `update_contact` – Modify existing contact
- `update_deal` – Modify existing deal
- `update_account` – Modify existing account

### 🗑️ **Delete Tools**
- `delete_record` – Delete a record from any module

### 🔁 **Conversion Tools**
- `convert_lead` – Convert a lead into contact, account, and deal

---

## 🔐 Required Credentials

| Field                | Description                                       | Example                                                       |
|---------------------|---------------------------------------------------|---------------------------------------------------------------|
| `client_id`          | Client ID from Zoho API Console                  | `1000.12AB34CD56EF78GH90IJ12345678KLMN`                       |
| `client_secret`      | Client Secret from Zoho API Console              | `abcd1234efgh5678ijkl9012mnop3456qrst7890`                   |
| `authentication_code`| Code from Zoho OAuth URL (used to get refresh token) | `1000.abcd1234efgh5678ijkl9012mnop3456.qrst7890uvwx1234`     |

### 📄 Credential Format (JSON)

```json
{
  "ZOHOMCP": {
    "client_id": "your-zoho-client-id",
    "client_secret": "your-zoho-client-secret",
    "authentication_code": "your-zoho-auth-code"
  }
}
```
### How to Get These Credentials

**Step-by-Step:**

1. **Create Zoho API Application**
  - Go to [Zoho API Console](https://api-console.zoho.com/)
  - Login with your Zoho account
  - Click "Add Client" → Choose "Server-based Applications"

2. **Configure Application Settings**
  - Enter your application details:
    - **Client Name**: Your app name
    - **Homepage URL**: Your website URL
    - **Authorized Redirect URIs**: Your callback URL
  - Click "Create"

3. **Get Client ID & Client Secret**
  - After creating the app, you'll see:
    - **Client ID**: Copy this value
    - **Client Secret**: Copy this value

4. **Generate Authentication Code**
  - Construct the OAuth URL:
    ```
    https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL&client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=YOUR_REDIRECT_URI&access_type=offline
    ```
  - Replace `YOUR_CLIENT_ID` and `YOUR_REDIRECT_URI` with your values
  - Visit this URL in your browser
  - Grant permissions and copy the `code` parameter from the redirect URL

5. **Required Scopes**
  - Minimum required: `ZohoCRM.modules.ALL`
  - For specific operations, you can use:
    - `ZohoCRM.modules.leads.ALL`
    - `ZohoCRM.modules.contacts.ALL`
    - `ZohoCRM.modules.deals.ALL`
    - `ZohoCRM.modules.accounts.ALL`