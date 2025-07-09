#!/usr/bin/env node

const { Server } = require("@modelcontextprotocol/sdk/server/index.js")
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js")
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js")
const { GoogleGenerativeAI } = require("@google/generative-ai")

// Import handlers
const { deploymentHandlers } = require("./handlers/deployment-handlers.js")
const { domainHandlers } = require("./handlers/domain-handlers.js")
const { environmentHandlers } = require("./handlers/environment-handlers.js")
const { securityHandlers } = require("./handlers/security-handlers.js")
const { monitoringHandlers } = require("./handlers/monitoring-handlers.js")
const { userHandlers } = require("./handlers/user-handlers.js")
const { marketplaceHandlers } = require("./handlers/marketplace-handlers.js")
const { secretHandlers } = require("./handlers/secret-handlers.js")
const { artifactHandlers } = require("./handlers/artifact-handlers.js")
const { teamHandlers } = require("./handlers/team-handlers.js")
const { projectHandlers } = require("./handlers/project-handlers.js")
const { aiHandlers } = require("./handlers/ai-handlers.js")

const dotenv = require("dotenv")
dotenv.config()
// Import utilities
const { validateEnvironment, createContext } = require("./utils/helpers.js")

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

    console.error("Vercel MCP server running on stdio")
  }
}

// Run the server
if (require.main === module) {
  const server = new VercelMCPServer()
  server.run().catch(console.error)
}

module.exports = { VercelMCPServer }
