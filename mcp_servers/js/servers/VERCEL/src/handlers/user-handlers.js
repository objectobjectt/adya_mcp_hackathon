import { makeVercelRequest, formatResponse } from "../utils/helpers.js";

const userHandlers = {
    get_user: {
        description: "Get current user information",
        inputSchema: {
            type: "object",
            properties: {},
        },
        execute: async (args, context) => {
            const data = await makeVercelRequest("/v2/user", {
                token: context.vercelToken,
            });

            return formatResponse(data, "Current user information");
        },
    },

    update_user: {
        description: "Update user profile information",
        inputSchema: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "User's display name",
                },
                email: {
                    type: "string",
                    description: "User's email address",
                },
                bio: {
                    type: "string",
                    description: "User's bio",
                },
                website: {
                    type: "string",
                    description: "User's website URL",
                },
            },
        },
        execute: async (args, context) => {
            const updateData = {};
            if (args.name) updateData.name = args.name;
            if (args.email) updateData.email = args.email;
            if (args.bio) updateData.bio = args.bio;
            if (args.website) updateData.website = args.website;

            const data = await makeVercelRequest("/v2/user", {
                method: "PATCH",
                body: updateData,
                token: context.vercelToken,
            });

            return formatResponse(data, "User profile updated");
        },
    },

    list_user_events: {
        description: "List user activity events",
        inputSchema: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Maximum number of events to return",
                    default: 20,
                },
                since: {
                    type: "string",
                    description: "Get events after this timestamp",
                },
                until: {
                    type: "string",
                    description: "Get events before this timestamp",
                },
            },
        },
        execute: async (args, context) => {
            const params = {
                limit: args.limit,
                since: args.since,
                until: args.until,
            };

            const data = await makeVercelRequest("/v3/user/events", {
                params,
                token: context.vercelToken,
            });

            return formatResponse(data, `User events (${data.events?.length || 0})`);
        },
    },

    get_user_tokens: {
        description: "List user authentication tokens",
        inputSchema: {
            type: "object",
            properties: {},
        },
        execute: async (args, context) => {
            const data = await makeVercelRequest("/v3/user/tokens", {
                token: context.vercelToken,
            });

            return formatResponse(data, `User tokens (${data.tokens?.length || 0})`);
        },
    },

    create_user_token: {
        description: "Create a new authentication token",
        inputSchema: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "Token name",
                },
                expiresAt: {
                    type: "string",
                    description: "Token expiration date (ISO string)",
                },
            },
            required: ["name"],
        },
        execute: async (args, context) => {
            const tokenData = {
                name: args.name,
                expiresAt: args.expiresAt,
            };

            const data = await makeVercelRequest("/v3/user/tokens", {
                method: "POST",
                body: tokenData,
                token: context.vercelToken,
            });

            return formatResponse(data, `Token created: ${args.name}`);
        },
    },

    delete_user_token: {
        description: "Delete an authentication token",
        inputSchema: {
            type: "object",
            properties: {
                tokenId: {
                    type: "string",
                    description: "Token ID to delete",
                },
            },
            required: ["tokenId"],
        },
        execute: async (args, context) => {
            await makeVercelRequest(`/v3/user/tokens/${args.tokenId}`, {
                method: "DELETE",
                token: context.vercelToken,
            });

            return {
                content: [
                    {
                        type: "text",
                        text: `Token ${args.tokenId} deleted successfully`,
                    },
                ],
            };
        },
    },
};

export { userHandlers };
