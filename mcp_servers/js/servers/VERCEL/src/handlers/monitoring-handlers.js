import { makeVercelRequest, validateParams, formatResponse } from "../utils/helpers.js";

const monitoringHandlers = {
  get_project_analytics: {
    description: "Get analytics data for a project",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Project ID to get analytics for",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
        from: {
          type: "string",
          description: "Start date (ISO string)",
        },
        to: {
          type: "string",
          description: "End date (ISO string)",
        },
        granularity: {
          type: "string",
          enum: ["day", "hour"],
          description: "Data granularity",
          default: "day",
        },
      },
      required: ["projectId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["projectId"])

      const params = {
        projectId: args.projectId,
        from: args.from,
        to: args.to,
        granularity: args.granularity || "day",
      }

      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest("/v2/analytics", {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Analytics for project ${args.projectId}`)
    },
  },

  get_deployment_analytics: {
    description: "Get analytics data for a specific deployment",
    inputSchema: {
      type: "object",
      properties: {
        deploymentId: {
          type: "string",
          description: "Deployment ID to get analytics for",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
        from: {
          type: "string",
          description: "Start date (ISO string)",
        },
        to: {
          type: "string",
          description: "End date (ISO string)",
        },
      },
      required: ["deploymentId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["deploymentId"])

      const params = {
        deploymentId: args.deploymentId,
        from: args.from,
        to: args.to,
      }

      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest("/v2/analytics", {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Analytics for deployment ${args.deploymentId}`)
    },
  },

  get_usage_metrics: {
    description: "Get usage metrics for a team",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
        from: {
          type: "string",
          description: "Start date (ISO string)",
        },
        to: {
          type: "string",
          description: "End date (ISO string)",
        },
      },
    },
    execute: async (args, context) => {
      const params = {
        from: args.from,
        to: args.to,
      }

      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest("/v2/usage", {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, "Usage metrics")
    },
  },

  get_bandwidth_usage: {
    description: "Get bandwidth usage for a team",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
        from: {
          type: "string",
          description: "Start date (ISO string)",
        },
        to: {
          type: "string",
          description: "End date (ISO string)",
        },
      },
    },
    execute: async (args, context) => {
      const params = {
        from: args.from,
        to: args.to,
      }

      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest("/v1/bandwidth/usage", {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, "Bandwidth usage")
    },
  },

  get_function_invocations: {
    description: "Get function invocation metrics",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
        projectId: {
          type: "string",
          description: "Project ID (optional)",
        },
        from: {
          type: "string",
          description: "Start date (ISO string)",
        },
        to: {
          type: "string",
          description: "End date (ISO string)",
        },
      },
    },
    execute: async (args, context) => {
      const params = {
        from: args.from,
        to: args.to,
      }

      if (args.teamId) {
        params.teamId = args.teamId
      }

      if (args.projectId) {
        params.projectId = args.projectId
      }

      const data = await makeVercelRequest("/v1/functions/usage", {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, "Function invocation metrics")
    },
  },
}

export { monitoringHandlers }
