const { makeVercelRequest, validateParams, formatResponse } = require("../utils/helpers.js")

const artifactHandlers = {
  list_artifacts: {
    description: "List build artifacts for a deployment",
    inputSchema: {
      type: "object",
      properties: {
        deploymentId: {
          type: "string",
          description: "Deployment ID to list artifacts for",
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

      const data = await makeVercelRequest(`/v2/deployments/${args.deploymentId}/artifacts`, {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Artifacts for deployment ${args.deploymentId} (${data.artifacts?.length || 0})`)
    },
  },

  get_artifact: {
    description: "Get detailed information about a specific artifact",
    inputSchema: {
      type: "object",
      properties: {
        deploymentId: {
          type: "string",
          description: "Deployment ID",
        },
        artifactId: {
          type: "string",
          description: "Artifact ID to get details for",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["deploymentId", "artifactId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["deploymentId", "artifactId"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest(`/v2/deployments/${args.deploymentId}/artifacts/${args.artifactId}`, {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Artifact details: ${args.artifactId}`)
    },
  },

  download_artifact: {
    description: "Get download URL for an artifact",
    inputSchema: {
      type: "object",
      properties: {
        deploymentId: {
          type: "string",
          description: "Deployment ID",
        },
        artifactId: {
          type: "string",
          description: "Artifact ID to download",
        },
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
      },
      required: ["deploymentId", "artifactId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["deploymentId", "artifactId"])

      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest(
        `/v2/deployments/${args.deploymentId}/artifacts/${args.artifactId}/download`,
        {
          params,
          token: context.vercelToken,
        },
      )

      return formatResponse(data, `Download URL for artifact ${args.artifactId}`)
    },
  },

  list_build_cache: {
    description: "List build cache entries",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
        projectId: {
          type: "string",
          description: "Project ID to filter cache entries",
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

      const data = await makeVercelRequest("/v1/build-cache", {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Build cache entries (${data.cache?.length || 0})`)
    },
  },

  clear_build_cache: {
    description: "Clear build cache for a project",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Project ID to clear cache for",
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

      await makeVercelRequest(`/v1/build-cache/${args.projectId}`, {
        method: "DELETE",
        params,
        token: context.vercelToken,
      })

      return {
        content: [
          {
            type: "text",
            text: `Build cache cleared for project ${args.projectId}`,
          },
        ],
      }
    },
  },
}

module.exports = { artifactHandlers }
