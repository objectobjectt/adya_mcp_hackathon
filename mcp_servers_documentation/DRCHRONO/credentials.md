# DRCHRONO MCP Server Credentials

## Overview
This document provides instructions on obtaining and structuring the credentials needed to connect the DrChrono MCP Server in the Vanij Platform.

---

## Credential Format

```json
{
  "DRCHRONO": {
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "access_token": "your-access-token",
    "refresh_token": "your-refresh-token",
    "redirect_uri": "your-redirect-uri"
  }
}
```
| Field           | Description                                                            |
| --------------- | ---------------------------------------------------------------------- |
| `client_id`     | The client ID provided by DrChrono when you register your application. |
| `client_secret` | The client secret associated with your client ID.                      |
| `access_token`  | OAuth2 access token used for making API requests.                      |
| `refresh_token` | Token used to obtain a new access token when the current one expires.  |
| `redirect_uri`  | The URI DrChrono redirects to after user authorization.                |
