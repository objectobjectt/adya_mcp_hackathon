# InfluxDB MCP Server Credentials Documentation


## 🔐 Required Credentials

| Field             | Description                                     | Example                                            |
| ----------------- | ----------------------------------------------- | -------------------------------------------------- |
| `influxdb_url`    | Base URL of your InfluxDB instance              | `https://eu-central-1-1.aws.cloud2.influxdata.com` |
| `influxdb_token`  | API token to authorize requests                 | `my-long-token-abc123`                             |
| `influxdb_default_org_id` | Unique identifier of your InfluxDB organization | `1234567890abcdef`                                 |


## 📦 Credential Format (JSON)

```json
{
  "INFLUXDB": {
    "influxdb_url": "https://your-influxdb-url",
    "influxdb_token": "your-influxdb-token",
    "influxdb_default_org_id": "your-influxdb-org-id"
  }
}
```


## 🛠️ How to Get These Credentials

### Step-by-Step:

1. **Login** to InfluxDB Cloud
   URL: [https://cloud2.influxdata.com](https://cloud2.influxdata.com)

2. **Get Token**
   Go to `Load Data` → `Tokens`
   → Create or select a token → Copy the token

3. **Get URL**
   Under your org (top-left) → Copy the `API Base URL`

4. **Get Organization ID**

   * Navigate to `Organisation Settings` and click on copy organisation ID.
   * OR use the API:

     ```bash
     curl -X GET "https://your-influxdb-url/api/v2/orgs" \
       -H "Authorization: Token your-influxdb-token"
     ```



## Example (Filled)

```json
{
  "INFLUXDB": {
    "influxdb_url": "https://your-influxdb-url",
    "influxdb_token": "your-influxdb-token",
    "influxdb_default_org_id": "your-influxdb-org-id"
  }
}
```