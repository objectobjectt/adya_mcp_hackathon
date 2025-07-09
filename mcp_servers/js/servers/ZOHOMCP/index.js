import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// importing modules
import { configureLogger } from './utils/logger.js';
import { tokenStorage } from './auth/tokenManagement.js';
import { extractCredentialsFromRequest } from './auth/creds.js';
import { exchangeCodeForTokens, getValidAccessToken } from './auth/oauth.js';
import { executeZohoFunctionWithCredentials } from './utils/functionExecutor.js';
import { zohoCrmTools } from './utils/toolDefinitions.js';

configureLogger();

const server = new Server(
    {
        name: "zoho-crm-server",
        version: "1.0.0",
        description: "MCP server for Zoho CRM integration with OAuth2 authentication",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: zohoCrmTools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "set_credentials") {
            const credentials = extractCredentialsFromRequest(args);
            if (!credentials) {
                throw new Error("Invalid credentials format");
            }
            
            tokenStorage.set(credentials.client_id, credentials);
            const authCode = args.authorization_code || args.autharization_code;
            if (authCode) {
                try {
                    const tokenData = await exchangeCodeForTokens(credentials.client_id, credentials.client_secret, authCode);
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        message: "Credentials set and authorization successful - tokens obtained and stored",
                                        access_token: tokenData.access_token,
                                        refresh_token: tokenData.refresh_token,
                                        expires_at: new Date(tokenData.expires_at).toISOString(),
                                    },
                                    null,
                                    2
                                ),
                            },
                        ],
                    };
                } catch (error) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(
                                    {
                                        success: false,
                                        error: `Authorization failed: ${error.message}`,
                                    },
                                    null,
                                    2
                                ),
                            },
                        ],
                    };
                }
            }

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(
                            {
                                success: true,
                                message: "Credentials set successfully",
                            },
                            null,
                            2
                        ),
                    },
                ],
            };
        }

        if (name === "authenticate") {
            const result = await executeZohoFunctionWithCredentials("authenticate", args, args);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }

        // Handling other zoho func
        const result = await executeZohoFunctionWithCredentials(name, args, args);
        
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            error: error.message,
                            success: false,
                        },
                        null,
                        2
                    ),
                },
            ],
        };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    console.log("🚀 Starting Zoho CRM MCP Server...");

    await server.connect(transport);
    console.log("✅ Zoho CRM MCP Server is running");
}

main().catch((error) => {
    console.error("❌ Server failed to start:", error);
    process.exit(1);
});