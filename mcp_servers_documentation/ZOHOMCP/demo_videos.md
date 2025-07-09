# ZOHO MCP Server – Demos and Payload Examples

## 🎥 Demo Video
- **MCP server setup explanation + API Execution + Features Testing**: [Watch Here](https://youtu.be/OVh2lQIRFfo)

---

## 🎥 Credentials Gathering Video
- **Gathering Credentials & Setup(Full ene - to - end video)**: [Watch Here](https://youtu.be/fUlAqh8o8Rw)

---

## 🔐 Credential JSON Payload
Example payload format for sending credentials to the MCP Server which going to be use it in Client API paylod:
```json
{
  "ZOHOMCP": {
    "client_id": "your-zoho-client-id",
    "client_secret": "your-zoho-client-secret",
    "authentication_code": "your-zoho-refresh-token",
  }
}
