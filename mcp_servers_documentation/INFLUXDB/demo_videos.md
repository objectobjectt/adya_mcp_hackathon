# InfluxDB MCP Server – Demos and Payload Examples

## 🎥 Demo Video
- **MCP server setup explanation + API Execution + Features Testing**: [Watch Here](https://blueurl.vercel.app/mcp-hackathon-influx-db-demo-video)

---

## 🎥 Credentials Gathering Video
- **Gathering Credentials & Setup(Full ene - to - end video)**: [Watch Here](https://blueurl.vercel.app/mcp-hackathon-influx-db-creds-video)

---

## 🔐 Credential JSON Payload
Example payload format for sending credentials to the MCP Server which going to be use it in Client API paylod:
```json
{
  "INFLUXDB": {
    "influxdb_url": "https://your-influxdb-url",
    "influxdb_token": "your-influxdb-token",
    "influxdb_default_org_id": "your-influxdb-org-id"
  }
}
