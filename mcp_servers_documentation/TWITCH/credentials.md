# TWITCH MCP Server Credentials

## Overview
This document provides instructions on obtaining and structuring the credentials needed to connect the Twitch MCP Server in the Vanij Platform.

---

## Credential Format

```json
{
  "TWITCH": {
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "access_token": "your-access-token",
    "refresh_token": "your-refresh-token",
    "redirect_uri": "your-redirect-uri"
  }
}
```
| Field           | Description                                                           |
| --------------- | --------------------------------------------------------------------- |
| `client_id`     | The client ID obtained from your Twitch Developer Console.            |
| `client_secret` | The client secret associated with your Twitch application.            |
| `access_token`  | OAuth2 access token used to authenticate API requests.                |
| `refresh_token` | Token used to refresh the access token after it expires.              |
| `redirect_uri`  | The URI where users are redirected after authorizing your Twitch app. |
