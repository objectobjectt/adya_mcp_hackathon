export const ClientsConfig:any = [
    "MCP_CLIENT_OPENAI",
    "MCP_CLIENT_AZURE_AI",
    "MCP_CLIENT_GEMINI",
    // "CLAUDE",
]

export const ServersConfig = [
    {
        server_name :"WORDPRESS", // Server Name should be same as the folder name in mcp_servers/js/servers/ folder.
        server_features_and_capability:`wordpress server is used to create, update, delete and get content from wordpress website.`,
        path : "build/index.js"
    },
    {
        server_name :"WOOCOMMERCE", // Server Name should be same as the folder name in mcp_servers/js/servers/ folder.
        server_features_and_capability:`WOOCOMMERCE`,
        path : "build/index.js" // path should be the build file path in the mcp Server under the folder name
    },
];

