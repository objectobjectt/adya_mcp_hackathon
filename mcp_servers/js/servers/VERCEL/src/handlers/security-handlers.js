import { makeVercelRequest, validateParams, formatResponse } from "../utils/helpers.js";

const securityHandlers = {
  list_security_events: {
    description: "List security events for a team",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
        limit: {
          type: "number",
          description: "Maximum number of events to return",
          default: 20,
        },
        since: {
          type: "string",
          description: "Get events after this timestamp",
        },
      },
    },
    execute: async (args, context) => {
      const params = {
        limit: args.limit,
        since: args.since,
      }

      if (args.teamId) {
        params.teamId = args.teamId
      }

      const data = await makeVercelRequest("/v1/security/events", {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, `Security events (${data.events?.length || 0})`)
    },
  },

  get_security_settings: {
    description: "Get security settings for a team",
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

      const data = await makeVercelRequest("/v1/security/settings", {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, "Security settings")
    },
  },

  update_security_settings: {
    description: "Update security settings for a team",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
        samlEnforced: {
          type: "boolean",
          description: "Enforce SAML authentication",
        },
        remoteCodeExecutionEnabled: {
          type: "boolean",
          description: "Enable remote code execution",
        },
        sensitiveEnvironmentAccessPolicy: {
          type: "string",
          enum: ["on", "off"],
          description: "Sensitive environment access policy",
        },
      },
    },
    execute: async (args, context) => {
      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const updateData = {}
      if (args.samlEnforced !== undefined) updateData.samlEnforced = args.samlEnforced
      if (args.remoteCodeExecutionEnabled !== undefined)
        updateData.remoteCodeExecutionEnabled = args.remoteCodeExecutionEnabled
      if (args.sensitiveEnvironmentAccessPolicy)
        updateData.sensitiveEnvironmentAccessPolicy = args.sensitiveEnvironmentAccessPolicy

      const data = await makeVercelRequest("/v1/security/settings", {
        method: "PATCH",
        body: updateData,
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, "Security settings updated")
    },
  },

  list_attack_challenge_settings: {
    description: "List attack challenge settings",
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

      const data = await makeVercelRequest("/v1/security/attack-challenge", {
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, "Attack challenge settings")
    },
  },

  update_attack_challenge_settings: {
    description: "Update attack challenge settings",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID (optional)",
        },
        enabled: {
          type: "boolean",
          description: "Enable attack challenge",
        },
        action: {
          type: "string",
          enum: ["challenge", "block"],
          description: "Action to take when attack is detected",
        },
      },
    },
    execute: async (args, context) => {
      const params = {}
      if (args.teamId) {
        params.teamId = args.teamId
      }

      const updateData = {}
      if (args.enabled !== undefined) updateData.enabled = args.enabled
      if (args.action) updateData.action = args.action

      const data = await makeVercelRequest("/v1/security/attack-challenge", {
        method: "PATCH",
        body: updateData,
        params,
        token: context.vercelToken,
      })

      return formatResponse(data, "Attack challenge settings updated")
    },
  },
}

export { securityHandlers }
