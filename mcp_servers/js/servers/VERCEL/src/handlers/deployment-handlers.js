const { makeVercelRequest, validateParams, formatResponse } = require("../utils/helpers.js")

const deploymentHandlers = {
  list_deployment: {
    description: "List deployments for a project",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Project ID to list deployments for",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
        limit: {
          type: "number",
          description: "Maximum number of deployments to return",
          default: 20,
        },
        since: {
          type: "string",
          description: "Get deployments created after this timestamp",
        },
        until: {
          type: "string",
          description: "Get deployments created before this timestamp",
        },
      },
      required: ["projectId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["projectId"])

      const params = {
        projectId: args.projectId,
        limit: args.limit,
        since: args.since,
        until: args.until,
      }

      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest("/v6/deployments", {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Deployments for project ${args.projectId} (${data.deployments?.length || 0})`)
    },
  },

  get_deployment: {
    description: "Get detailed information about a specific deployment",
    inputSchema: {
      type: "object",
      properties: {
        deploymentId: {
          type: "string",
          description: "Deployment ID to get details for",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["deploymentId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["deploymentId"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest(`/v13/deployments/${args.deploymentId}`, {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Deployment Details for ${args.deploymentId}`)
    },
  },

  get_deployment_events: {
    description: "Get events/logs for a specific deployment",
    inputSchema: {
      type: "object",
      properties: {
        deploymentId: {
          type: "string",
          description: "Deployment ID to get events for",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
        limit: {
          type: "number",
          description: "Maximum number of events to return",
          default: 100,
        },
      },
      required: ["deploymentId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["deploymentId"])

      const params = {
        limit: args.limit,
      }

      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest(`/v3/deployments/${args.deploymentId}/events`, {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Events for deployment ${args.deploymentId} (${data.length || 0})`)
    },
  },

  create_deployment: {
    description: "Create a new deployment",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Deployment name",
        },
        files: {
          type: "array",
          description: "Files to deploy",
          items: {
            type: "object",
            properties: {
              file: {
                type: "string",
                description: "File path",
              },
              data: {
                type: "string",
                description: "File content",
              },
            },
          },
        },
        projectSettings: {
          type: "object",
          description: "Project settings",
          properties: {
            framework: {
              type: "string",
              description: "Framework type",
            },
          },
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["name", "files"],
    },
    execute: async (args, context) => {
      validateParams(args, ["name", "files"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const deploymentData = {
        name: args.name,
        files: args.files,
        projectSettings: args.projectSettings || {},
      }

      const data = await makeVercelRequest("/v13/deployments", {
        method: "POST",
        body: deploymentData,
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Deployment created: ${args.name}`)
    },
  },

  cancel_deployment: {
    description: "Cancel a running deployment",
    inputSchema: {
      type: "object",
      properties: {
        deploymentId: {
          type: "string",
          description: "Deployment ID to cancel",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["deploymentId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["deploymentId"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest(`/v12/deployments/${args.deploymentId}/cancel`, {
        method: "PATCH",
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Deployment ${args.deploymentId} cancelled`)
    },
  },

  delete_deployment: {
    description: "Delete a deployment",
    inputSchema: {
      type: "object",
      properties: {
        deploymentId: {
          type: "string",
          description: "Deployment ID to delete",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["deploymentId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["deploymentId"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      await makeVercelRequest(`/v13/deployments/${args.deploymentId}`, {
        method: "DELETE",
        params,
        token: context.vercelToken,
      })

      return {
        content: [
          {
            type: "text",
            text: `Deployment ${args.deploymentId} deleted successfully`,
          },
        ],
      }
    },
  },
}

module.exports = { deploymentHandlers }
