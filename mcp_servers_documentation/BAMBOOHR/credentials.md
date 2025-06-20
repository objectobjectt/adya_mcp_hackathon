# BAMBOOHR MCP Server Credentials

## Overview
This document provides instructions on obtaining and structuring the credentials needed to connect the BambooHR MCP Server in the Vanij Platform.

---

## Credential Format

```json
{
  "BAMBOOHR": {
    "domain": "your-company-subdomain",
    "api_key": "your-api-key"
  }
}
```
| Field     | Description                                                                                                                               |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `domain`  | The subdomain of your BambooHR account (e.g., if your login URL is `https://yourcompany.bamboohr.com`, then the domain is `yourcompany`). |
| `api_key` | Your BambooHR API key used to authenticate API requests.                                                                                  |
