#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Import handlers
import { deploymentHandlers } from "./handlers/deployment-handlers.js";
import { domainHandlers } from "./handlers/domain-handlers.js";
import { environmentHandlers } from "./handlers/environment-handlers.js";
import { securityHandlers } from "./handlers/security-handlers.js";
import { monitoringHandlers } from "./handlers/monitoring-handlers.js";
import { userHandlers } from "./handlers/user-handlers.js";
import { marketplaceHandlers } from "./handlers/marketplace-handlers.js";
import { secretHandlers } from "./handlers/secret-handlers.js";
import { artifactHandlers } from "./handlers/artifact-handlers.js";
import { teamHandlers } from "./handlers/team-handlers.js";
import { projectHandlers } from "./handlers/project-handlers.js";
import { aiHandlers } from "./handlers/ai-handlers.js";
import { configDotenv } from "dotenv";
configDotenv();
// Import utilities
import { validateEnvironment, createContext  } from "./utils/helpers.js";

class VercelMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "vercel-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    )

    this.setupToolHandlers()
    this.setupErrorHandling()
  }

  setupToolHandlers() {
    // Combine all handlers
    const allHandlers = {
      ...deploymentHandlers,
      ...domainHandlers,
      ...environmentHandlers,
      ...securityHandlers,
      ...monitoringHandlers,
      ...userHandlers,
      ...marketplaceHandlers,
      ...secretHandlers,
      ...artifactHandlers,
      ...teamHandlers,
      ...projectHandlers,
      ...aiHandlers,
    }

    // Register list_tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Object.entries(allHandlers).map(([name, handler]) => ({
          name,
          description: handler.description,
          inputSchema: handler.inputSchema,
        })),
      }
    })

    // Register call_tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params

      console.log("Tool being called:", name);
      console.log("Arguments received:", JSON.stringify(args, null, 2));

      if (!allHandlers[name]) {
        throw new Error(`Tool ${name} not found`)
      }

      try {
        // Fix: Pass the full args object so createContext can access args.__credentials__
        const context = createContext(args)
        console.log("Context created:", JSON.stringify(context, null, 2));

        // Execute the tool
        const result = await allHandlers[name].execute(args, context)
        return result
      } catch (error) {
        console.error("Tool execution error:", error);
        throw new Error(`Tool execution failed: ${error.message}`)
      }
    })
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error)
    }

    process.on("SIGINT", async () => {
      await this.server.close()
      process.exit(0)
    })
  }

  async run() {
    // Validate environment variables
    // validateEnvironment()
    console.log("Validating environment variables:", process.env.VERCEL_TOKEN, process.env.GEMINI_API_KEY)
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
  }
}

// Run the server
const server = new VercelMCPServer()
server.run().catch(console.error)

export { VercelMCPServer }
