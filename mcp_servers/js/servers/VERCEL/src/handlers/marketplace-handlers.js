import { makeVercelRequest, validateParams, formatResponse } from "../utils/helpers.js";

const marketplaceHandlers = {
  list_integrations: {
    description: "List available marketplace integrations",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
        category: {
          type: "string",
          description: "Filter by integration category",
        },
        limit: {
          type: "number",
          description: "Maximum number of integrations to return",
          default: 20,
        },
      },
    },
    execute: async (args, context) => {
      const params = {
        limit: args.limit,
        category: args.category,
      }

      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest("/v1/integrations", {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Available integrations (${data.integrations?.length || 0})`)
    },
  },

  get_integration: {
    description: "Get detailed information about a specific integration",
    inputSchema: {
      type: "object",
      properties: {
        integrationId: {
          type: "string",
          description: "Integration ID to get details for",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["integrationId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["integrationId"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest(`/v1/integrations/${args.integrationId}`, {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Integration details: ${args.integrationId}`)
    },
  },

  list_installed_integrations: {
    description: "List installed integrations for a team",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
    },
    execute: async (args, context) => {
      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest("/v1/integrations/installations", {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Installed integrations (${data.installations?.length || 0})`)
    },
  },

  install_integration: {
    description: "Install a marketplace integration",
    inputSchema: {
      type: "object",
      properties: {
        integrationId: {
          type: "string",
          description: "Integration ID to install",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
        configuration: {
          type: "object",
          description: "Integration configuration",
        },
      },
      required: ["integrationId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["integrationId"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const installData = {
        integrationId: args.integrationId,
        configuration: args.configuration || {},
      }

      const data = await makeVercelRequest("/v1/integrations/installations", {
        method: "POST",
        body: installData,
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Integration ${args.integrationId} installed`)
    },
  },

  uninstall_integration: {
    description: "Uninstall an integration",
    inputSchema: {
      type: "object",
      properties: {
        installationId: {
          type: "string",
          description: "Installation ID to remove",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["installationId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["installationId"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      await makeVercelRequest(`/v1/integrations/installations/${args.installationId}`, {
        method: "DELETE",
        params,
        token: context.vercelToken,
      })

      return {
        content: [
          {
            type: "text",
            text: `Integration installation ${args.installationId} removed successfully`,
          },
        ],
      }
    },
  },
}

export { marketplaceHandlers }
