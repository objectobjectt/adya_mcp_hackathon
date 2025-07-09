export const ClientsConfig: any = [
  "MCP_CLIENT_OPENAI",
  "MCP_CLIENT_AZURE_AI",
  "MCP_CLIENT_GEMINI",
  // "CLAUDE",
]

export const ServersConfig: any = [
  // {
  //     server_name :"WORDPRESS",
  //     server_features_and_capability:`WORDPRESS`,
  //     path : "build/index.js"
  // },
  {
    server_name: "INFLUXDB",
    server_features_and_capability: `INFLUXDB`,
    path: "build/index.js"
  },
  {
    server_name: "PODMAN",
    server_features_and_capability: `PODMAN`,
    path: "build/index.js"
  },
  {
    server_name: "FEDORA",
    server_features_and_capability: `FEDORA`,
    path: "build/index.js"
  },
  {
    server_name: "ZOHOMCP",
    server_features_and_capability: `ZOHOMCP`,
    path: "index.js"
  }
]

