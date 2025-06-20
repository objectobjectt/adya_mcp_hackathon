# ORACLE MCP Server Credentials

## Overview
This document provides instructions on obtaining and structuring the credentials needed to connect the Oracle MCP Server in the Vanij Platform.

---

## Credential Format
```json
{
  "ORACLE": {
    "host": "your-oracle-host",
    "port": 1521,
    "serviceName": "your-service-name",
    "username": "your-oracle-username",
    "password": "your-oracle-password"
  }
}

```
| Field         | Description                                                     |
| ------------- | --------------------------------------------------------------- |
| `host`        | The hostname or IP address of the Oracle database server.       |
| `port`        | The port number for Oracle DB (default is `1521`).              |
| `serviceName` | The Oracle service name (e.g., `ORCL`, `XE`, or a custom name). |
| `username`    | The Oracle database username.                                   |
| `password`    | The password for the specified Oracle user.                     |
