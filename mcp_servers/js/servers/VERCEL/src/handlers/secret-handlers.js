const { makeVercelRequest, validateParams, formatResponse } = require("../utils/helpers.js")

const secretHandlers = {
  list_secrets: {
    description: "List secrets for a team",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
        projectId: {
          type: "string",
          description: "Project ID to filter secrets",
        },
      },
    },
    execute: async (args, context) => {
      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }
      if (args.projectId) {
        params.projectId = args.projectId
      }

      const data = await makeVercelRequest("/v3/secrets", {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Secrets (${data.secrets?.length || 0})`)
    },
  },

  get_secret: {
    description: "Get a specific secret",
    inputSchema: {
      type: "object",
      properties: {
        secretId: {
          type: "string",
          description: "Secret ID or name",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["secretId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["secretId"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest(`/v3/secrets/${args.secretId}`, {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Secret: ${args.secretId}`)
    },
  },

  create_secret: {
    description: "Create a new secret",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Secret name",
        },
        value: {
          type: "string",
          description: "Secret value",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["name", "value"],
    },
    execute: async (args, context) => {
      validateParams(args, ["name", "value"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const secretData = {
        name: args.name,
        value: args.value,
      }

      const data = await makeVercelRequest("/v3/secrets", {
        method: "POST",
        body: secretData,
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Secret created: ${args.name}`)
    },
  },

  update_secret: {
    description: "Update an existing secret",
    inputSchema: {
      type: "object",
      properties: {
        secretId: {
          type: "string",
          description: "Secret ID or name to update",
        },
        name: {
          type: "string",
          description: "New secret name",
        },
        value: {
          type: "string",
          description: "New secret value",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["secretId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["secretId"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const updateData = {}
      if (args.name) updateData.name = args.name
      if (args.value) updateData.value = args.value

      const data = await makeVercelRequest(`/v3/secrets/${args.secretId}`, {
        method: "PATCH",
        body: updateData,
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Secret updated: ${args.secretId}`)
    },
  },

  delete_secret: {
    description: "Delete a secret",
    inputSchema: {
      type: "object",
      properties: {
        secretId: {
          type: "string",
          description: "Secret ID or name to delete",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["secretId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["secretId"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      await makeVercelRequest(`/v3/secrets/${args.secretId}`, {
        method: "DELETE",
        params,
        token: context.vercelToken,
      })

      return {
        content: [
          {
            type: "text",
            text: `Secret ${args.secretId} deleted successfully`,
          },
        ],
      }
    },
  },
}

module.exports = { secretHandlers }
