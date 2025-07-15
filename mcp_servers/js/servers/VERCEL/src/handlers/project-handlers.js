import { makeVercelRequest, validateParams, formatResponse } from "../utils/helpers.js";

const projectHandlers = {
  list_projects: {
    description: "List all Vercel projects",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
        limit: {
          type: "number",
          description: "Maximum number of projects to return",
          default: 20,
        },
        search: {
          type: "string",
          description: "Search projects by name",
        },
      },
    },
    execute: async (args, context) => {
      const params = {
        limit: args.limit,
        search: args.search,
      }

      // Use teamId from args first, then from context (credentials), then none
      if (args.teamId) {
        params.teamId = args.teamId
      } else if (context.teamId) {
        params.teamId = context.teamId
      }

      const data = await makeVercelRequest("/v9/projects", {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Projects (${data.projects?.length || 0})`)
    },
  },

  get_project: {
    description: "Get detailed information about a specific project",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Project ID or name",
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
      // Use teamId from args first, then from context (credentials), then none
      if (args.teamId) {
        params.teamId = args.teamId
      } else if (context.teamId) {
        params.teamId = context.teamId
      }

      const data = await makeVercelRequest(`/v9/projects/${args.projectId}`, {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Project Details`)
    },
  },

  create_project: {
    description: "Create a new Vercel project",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Project name",
        },
        framework: {
          type: "string",
          description: "Framework type (nextjs, react, vue, etc.)",
        },
        gitRepository: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["github", "gitlab", "bitbucket"],
            },
            repo: {
              type: "string",
              description: "Repository name (owner/repo)",
            },
          },
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

      const projectData = {
        name: args.name,
        framework: args.framework,
        gitRepository: args.gitRepository,
      }

      const data = await makeVercelRequest("/v10/projects", {
        method: "POST",
        body: projectData,
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Project Created`)
    },
  },

  delete_project: {
    description: "Delete a Vercel project",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Project ID or name to delete",
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

      await makeVercelRequest(`/v9/projects/${args.projectId}`, {
        method: "DELETE",
        params,
        token: context.vercelToken,
      })

      return {
        content: [
          {
            type: "text",
            text: `Project ${args.projectId} deleted successfully`,
          },
        ],
      }
    },
  },
}

export { projectHandlers }
