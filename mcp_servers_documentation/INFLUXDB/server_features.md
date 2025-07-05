# InfluxDB MCP Server Overview

## What is the InfluxDB MCP Server?
The InfluxDB MCP Server is a connector within the Vanij Platform that enables seamless interaction with InfluxDB time-series databases using the InfluxDB API. It connects to InfluxDB Cloud or self-hosted instances using secure API tokens.

---

## Key Features
- ✅ Query and write time-series data using Flux query language
- ✅ Manage organizations, buckets, and measurements
- ✅ Execute health checks and monitor database status
- ✅ Create and manage automated tasks for data processing
- ✅ Handle labels and organizational structure
- ✅ Support for line protocol data ingestion

---

## Capabilities

| Capability           | Description                                       |
|----------------------|---------------------------------------------------|
| Data Management      | Query, write, and retrieve time-series data      |
| Organization Control| Create, delete, and manage organizations         |
| Bucket Operations    | Create, delete, and list data buckets           |
| Task Automation      | Create and manage scheduled Flux tasks          |
| Label Management     | Organize resources with custom labels            |
| Health Monitoring    | Check database health and connectivity           |
| User Management      | Add/remove organization members                  |

---

## Tool Categories

### **Data Operations**
- `query-data` - Execute Flux queries to retrieve data
- `write-data` - Write data in line protocol format
- `execute-query` - Execute custom Flux queries
- `bucket-measurements` - List measurements in specific buckets

### **Organization Management**
- `list-organizations` - List all organizations
- `create-org` - Create new organizations
- `delete-org` - Remove organizations
- `list-org-members` - View organization members
- `add-org-member` - Add users to organizations
- `remove-org-member` - Remove users from organizations

### **Bucket Management**
- `list-buckets` - List all available buckets
- `create-bucket` - Create new data buckets
- `delete-bucket` - Remove existing buckets

### **Task Management**
- `list-tasks` - View all automated tasks
- `create-task` - Create new scheduled tasks
- `update-task` - Modify existing tasks
- `add-label-to-task` - Associate labels with tasks
- `list-task-labels` - View task labels
- `delete-label-from-task` - Remove labels from tasks

### **Label Management**
- `list-labels` - View all labels in an organization
- `create-label` - Create new labels with colors
- `update-label` - Modify existing labels
- `delete-label` - Remove labels

### **Utility Tools**
- `health-check` - Monitor database health status
- `flux-query-examples` - Get Flux query examples
- `line-protocol-guide` - Learn line protocol format

---

## Supported InfluxDB Versions
- InfluxDB 2.0+
- InfluxDB Cloud and self-hosted instances
- Requires Flux query language support
- Compatible with both cloud and on-premise deployments

---

## Security Notes
- **Secure API token authentication** - Uses InfluxDB API tokens
- Supports organization-based access control
- All communications secured over HTTPS
- Token-based permissions follow InfluxDB's role system

---

## Required Credentials

| Field             | Description                                     | Example                                            |
| ----------------- | ----------------------------------------------- | -------------------------------------------------- |
| `influxdb_url`    | Base URL of your InfluxDB instance              | `https://eu-central-1-1.aws.cloud2.influxdata.com` |
| `influxdb_token`  | API token to authorize requests                 | `my-long-token-abc123`                             |
| `influxdb_default_org_id` | Unique identifier of your InfluxDB organization | `1234567890abcdef`                                 |

### Credential Format (JSON)
```json
{
  "INFLUXDB": {
    "influxdb_url": "https://your-influxdb-url",
    "influxdb_token": "your-influxdb-token",
    "influxdb_default_org_id": "your-influxdb-org-id"
  }
}
```

### How to Get These Credentials

**Step-by-Step:**
1. **Login** to InfluxDB Cloud  
   URL: [https://cloud2.influxdata.com](https://cloud2.influxdata.com)
2. **Get Token**  
   Go to `Load Data` → `Tokens` → Create or select a token → Copy the token
3. **Get URL**  
   Under your org (top-left) → Copy the `API Base URL`
4. **Get Organization ID**  
   Navigate to *Organization Settings* and click on copy organization ID

---

## Integration Use Cases
- IoT sensor data collection and analysis
- Application performance monitoring
- Infrastructure metrics aggregation
- Real-time analytics and alerting
- Time-series data visualization
- Automated data processing pipelines
- Historical trend analysis

---

## Prerequisites
- InfluxDB 2.0+ instance (Cloud or self-hosted)
- Valid API token with appropriate permissions
- Network connectivity to InfluxDB instance
- Organization ID for the target InfluxDB organization

---

## Example Workflows

### Basic Data Query
1. Use `health-check` to verify connectivity
2. List available organizations with `list-organizations`
3. Query data using `query-data` with Flux syntax

### Data Ingestion
1. Create or select target bucket with `create-bucket`
2. Write data using `write-data` in line protocol format
3. Verify data with `query-data`

### Task Automation
1. Create scheduled task with `create-task`
2. Associate labels using `add-label-to-task`
3. Monitor task execution and update as needed