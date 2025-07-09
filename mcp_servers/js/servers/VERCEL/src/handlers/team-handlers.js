const { makeVercelRequest, validateParams, formatResponse } = require("../utils/helpers.js")

const teamHandlers = {
  list_teams: {
    description: "List all teams for the authenticated user",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of teams to return",
          default: 20,
        },
        since: {
          type: "string",
          description: "Get teams created after this timestamp",
        },
      },
    },
    execute: async (args, context) => {
      const data = await makeVercelRequest("/v2/teams", {
        token: context.vercelToken,
      })

      return formatResponse(data, `Teams (${data.teams?.length || 0})`)
    },
  },

  get_team: {
    description: "Get detailed information about a specific team",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID to get details for",
        },
      },
      required: ["teamId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["teamId"])

      const data = await makeVercelRequest(`/v2/teams/${args.teamId}`, {
        token: context.vercelToken,
      })

      return formatResponse(data, `Team Details`)
    },
  },

  create_team: {
    description: "Create a new team",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Team name",
        },
        slug: {
          type: "string",
          description: "Team slug (optional)",
        },
      },
      required: ["name"],
    },
    execute: async (args, context) => {
      validateParams(args, ["name"])

      const teamData = {
        name: args.name,
        slug: args.slug,
      }

      const data = await makeVercelRequest("/v1/teams", {
        method: "POST",
        body: teamData,
        token: context.vercelToken,
      })

      return formatResponse(data, `Team Created`)
    },
  },

  list_team_members: {
    description: "List all members of a team",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID to list members for",
        },
        limit: {
          type: "number",
          description: "Maximum number of members to return",
          default: 20,
        },
      },
      required: ["teamId"],
    },
    execute: async (args, context) => {
      validateParams(args, ["teamId"])

      const data = await makeVercelRequest(`/v2/teams/${args.teamId}/members`, {
        token: context.vercelToken,
      })

      return formatResponse(data, `Team Members (${data.members?.length || 0})`)
    },
  },

  invite_team_member: {
    description: "Invite a new member to a team",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID to invite member to",
        },
        email: {
          type: "string",
          description: "Email address of the user to invite",
        },
        role: {
          type: "string",
          enum: ["OWNER", "MEMBER", "VIEWER"],
          description: "Role to assign to the invited member",
          default: "MEMBER",
        },
      },
      required: ["teamId", "email"],
    },
    execute: async (args, context) => {
      validateParams(args, ["teamId", "email"])

      const inviteData = {
        email: args.email,
        role: args.role || "MEMBER",
      }

      const data = await makeVercelRequest(`/v1/teams/${args.teamId}/members`, {
        method: "POST",
        body: inviteData,
        token: context.vercelToken,
      })

      return formatResponse(data, `Team Member Invited`)
    },
  },
}

module.exports = { teamHandlers }
