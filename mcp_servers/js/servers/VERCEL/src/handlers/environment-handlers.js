const { makeVercelRequest, validateParams, formatResponse } = require("../utils/helpers.js")

const environmentHandlers = {
  list_env: {
    description: "List environment variables for a project",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Project ID to list environment variables for",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["projectId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["projectId"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest(`/v9/projects/${args.projectId}/env`, {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Environment variables for project ${args.projectId} (${data.envs?.length || 0})`)
    },
  },

  get_env: {
    description: "Get a specific environment variable",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Project ID",
        },
        envId: {
          type: "string",
          description: "Environment variable ID",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["projectId", "envId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["projectId", "envId"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest(`/v9/projects/${args.projectId}/env/${args.envId}`, {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Environment variable ${args.envId}`)
    },
  },

  add_env: {
    description: "Add an environment variable to a project",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Project ID to add environment variable to",
        },
        key: {
          type: "string",
          description: "Environment variable key",
        },
        value: {
          type: "string",
          description: "Environment variable value",
        },
        target: {
          type: "array",
          description: "Target environments",
          items: {
            type: "string",
            enum: ["production", "preview", "development"],
          },
        },
        type: {
          type: "string",
          enum: ["plain", "secret", "encrypted"],
          description: "Environment variable type",
          default: "encrypted",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["projectId", "key", "value", "target"],
    },
    execute: async (args, context) => {
      validateParams(args, ["projectId", "key", "value", "target"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const envData = {
        key: args.key,
        value: args.value,
        target: args.target,
        type: args.type || "encrypted",
      }

      const data = await makeVercelRequest(`/v10/projects/${args.projectId}/env`, {
        method: "POST",
        body: envData,
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Environment variable ${args.key} added to project ${args.projectId}`)
    },
  },

  update_env: {
    description: "Update an environment variable",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Project ID",
        },
        envId: {
          type: "string",
          description: "Environment variable ID to update",
        },
        key: {
          type: "string",
          description: "New environment variable key",
        },
        value: {
          type: "string",
          description: "New environment variable value",
        },
        target: {
          type: "array",
          description: "Target environments",
          items: {
            type: "string",
            enum: ["production", "preview", "development"],
          },
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["projectId", "envId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["projectId", "envId"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const updateData = {}
      if (args.key) updateData.key = args.key
      if (args.value) updateData.value = args.value
      if (args.target) updateData.target = args.target

      const data = await makeVercelRequest(`/v9/projects/${args.projectId}/env/${args.envId}`, {
        method: "PATCH",
        body: updateData,
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Environment variable ${args.envId} updated`)
    },
  },

  delete_env: {
    description: "Delete an environment variable",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Project ID",
        },
        envId: {
          type: "string",
          description: "Environment variable ID to delete",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["projectId", "envId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["projectId", "envId"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      await makeVercelRequest(`/v9/projects/${args.projectId}/env/${args.envId}`, {
        method: "DELETE",
        params,
        token: context.vercelToken,
      })

      return {
        content: [
          {
            type: "text",
            text: `Environment variable ${args.envId} deleted successfully`,
          },
        ],
      }
    },
  },
}

module.exports = { environmentHandlers }
