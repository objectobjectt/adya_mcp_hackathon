const { makeVercelRequest, validateParams, formatResponse } = require("../utils/helpers.js")

const domainHandlers = {
  list_domains: {
    description: "List all domains for a team",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
        limit: {
          type: "number",
          description: "Maximum number of domains to return",
          default: 20,
        },
      },
    },
    execute: async (args, context) => {
      const params = {
        limit: args.limit,
      }

      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest("/v5/domains", {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Domains (${data.domains?.length || 0})`)
    },
  },

  get_domain: {
    description: "Get detailed information about a specific domain",
    inputSchema: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          description: "Domain name to get details for",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["domain"],
    },
    execute: async (args, context) => {
      validateParams(args, ["domain"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest(`/v5/domains/${args.domain}`, {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Domain Details: ${args.domain}`)
    },
  },

  add_domain: {
    description: "Add a domain to a project",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Domain name to add",
        },
        projectId: {
          type: "string",
          description: "Project ID to add domain to",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["name", "projectId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["name", "projectId"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const domainData = {
        name: args.name,
        projectId: args.projectId,
      }

      const data = await makeVercelRequest("/v10/projects/domains", {
        method: "POST",
        body: domainData,
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Domain ${args.name} added to project ${args.projectId}`)
    },
  },

  remove_domain: {
    description: "Remove a domain from a project",
    inputSchema: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          description: "Domain name to remove",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["domain"],
    },
    execute: async (args, context) => {
      validateParams(args, ["domain"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      await makeVercelRequest(`/v6/domains/${args.domain}`, {
        method: "DELETE",
        params,
        token: context.vercelToken,
      })

      return {
        content: [
          {
            type: "text",
            text: `Domain ${args.domain} removed successfully`,
          },
        ],
      }
    },
  },

  domain_check: {
    description: "Check if a domain is available for registration",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Domain name to check",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["name"],
    },
    execute: async (args, context) => {
      validateParams(args, ["name"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest(`/v4/domains/status?name=${args.name}`, {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Domain availability check for ${args.name}`)
    },
  },

  verify_domain: {
    description: "Verify domain ownership",
    inputSchema: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          description: "Domain name to verify",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["domain"],
    },
    execute: async (args, context) => {
      validateParams(args, ["domain"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest(`/v5/domains/${args.domain}/verify`, {
        method: "POST",
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Domain verification for ${args.domain}`)
    },
  },
}

module.exports = { domainHandlers }
