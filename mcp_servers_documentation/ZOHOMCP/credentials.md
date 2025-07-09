# 📘 Zoho CRM MCP Server Credentials Documentation

This document outlines the required credentials and setup steps for integrating with the Zoho CRM API in the MCP server.

---

## 🔐 Required Credentials

| Field                | Description                                       | Example                                                       |
|---------------------|---------------------------------------------------|---------------------------------------------------------------|
| `client_id`     | Client ID from Zoho API Console                  | `1000.12AB34CD56EF78GH90IJ12345678KLMN`                       |
| `client_secret` | Client Secret from Zoho API Console              | `abcd1234efgh5678ijkl9012mnop3456qrst7890`                   |
| `authentication_code` | Token used for exchanging, got after oauth on `https://accounts.zoho.in/oauth/v2/auth?scope=ZohoCRM.modules.ALL&client_id={client_id}&response_type=code&access_type=offline&redirect_uri={callback_url}`       | `1000.abcd1234efgh5678ijkl9012mnop3456.qrst7890uvwx1234`     |




## 📦 Credential Format (JSON)

```json
{
  "ZOHOMCP": {
    "client_id": "your-zoho-client-id",
    "client_secret": "your-zoho-client-secret",
    "authentication_code": "your-zoho-refresh-token",
  }
}
