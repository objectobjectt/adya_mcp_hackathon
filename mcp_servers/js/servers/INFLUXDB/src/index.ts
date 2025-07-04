#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Import utilities
import { configureLogger } from "./utils/loggerConfig.js";

// Import resource handlers
import { listOrganizations } from "./handlers/organizationsHandler.js";
import { listBuckets } from "./handlers/bucketsHandler.js";
import { bucketMeasurements } from "./handlers/measurementsHandler.js";
import { executeQuery } from "./handlers/queryHandler.js";

// Import tool handlers
import { writeData } from "./handlers/writeDataTool.js";
import { queryData } from "./handlers/queryDataTool.js";
import { createBucket } from "./handlers/createBucketTool.js";
import { createOrg } from "./handlers/createOrgTool.js";

// Import prompt handlers
import { fluxQueryExamplesPrompt } from "./prompts/fluxQueryExamplesPrompt.js";
import { lineProtocolGuidePrompt } from "./prompts/lineProtocolGuidePrompt.js";
import { healthCheck } from "./handlers/healthCheckTool.js";
import { deleteBucket } from "./handlers/deleteBucketTool.js";
import { deleteOrg } from "./handlers/deleteOrg.js";
import { listTasks } from "./handlers/listTasks.js";
import { updateLabel } from "./handlers/updateLabelTool.js";
import { deleteLabel } from "./handlers/deleteLabelTool.js";
import { createLabel } from "./handlers/createLabelTool.js";
import { listLabels } from "./handlers/listLabelsTool.js";
import { addOrgMember } from "./handlers/addMemberToOrgTool.js";
import { removeOrgMember } from "./handlers/removeMemberTool.js";
import { listOrgMembers } from "./handlers/listOrgMembersTool.js";
import { addLabelToTask } from "./handlers/addLabelToTaskTool.js";
import { listTaskLabels } from "./handlers/listTaskLabels.js";
import { deleteLabelFromTask } from "./handlers/deleteTaskLabel.js";
import { updateTask } from "./handlers/updateTaskTool.js";
import { createTask } from "./handlers/createTaskTool.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, ListPromptsRequest, McpError, ListPromptsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Configure logger and validate environment
configureLogger();

class InfluxDBServer {
    private server: Server;

    constructor() {
        this.server = new Server(
            {
                name: "InfluxDB-mcp-server",
                version: "0.1.0",
            },
            {
                capabilities: {
                    tools: {},
                    prompts: {},
                },
            }
        );

        this.setupToolHandlers();

        // Error handling
        this.server.onerror = (error: any) => console.error("[MCP Error]", error);
        process.on("SIGINT", async () => {
            await this.server.close();
            process.exit(0);
        });
    }

    private extractCredentialsFromRequest(requestBody) {
        try {
            // Check for the new expected format first
            if (requestBody.selected_server_credentials && requestBody.selected_server_credentials.ZOHOMCP) {
                const influxdbCredentials = requestBody.selected_server_credentials.ZOHOMCP;

                return {
                    influxdb_token: influxdbCredentials.influxdb_token,
                    influxdb_url: influxdbCredentials.influxdb_url,
                    influxdb_default_org: influxdbCredentials.influxdb_default_org || influxdbCredentials.influxdb_default_org_id || null,
                };
            }

            // Fallback: Check for credentials in __credentials__ (legacy format)
            if (requestBody.__credentials__) {
                const creds = requestBody.__credentials__;

                return {
                    influxdb_token: creds.influxdb_token,
                    influxdb_url: creds.influxdb_url,
                    influxdb_default_org: creds.influxdb_default_org || creds.influxdb_default_org_id || null,
                };
            }

            // Fallback: Direct credential structure (legacy)
            if (requestBody.influxdb_token && requestBody.influxdb_url) {
                return {
                    influxdb_token: requestBody.influxdb_token,
                    influxdb_url: requestBody.influxdb_url,
                    influxdb_default_org: requestBody.influxdb_default_org || requestBody.influxdb_default_org_id || null,
                };
            }

            console.log("[!!] No valid credentials found in request body");
            return null;
        } catch (error) {
            console.error("[!!] Error extracting credentials:", error);
            return null;
        }
    }

    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: "list-organizations",
                    description: "List all organizations in InfluxDB",
                    inputSchema: {
                        type: "object",
                        properties: {},
                    },
                },
                {
                    name: "list-buckets",
                    description: "List all buckets in InfluxDB",
                    inputSchema: {
                        type: "object",
                        properties: {},
                    },
                },
                {
                    name: "bucket-measurements",
                    description: "List measurements in a specific bucket",
                    inputSchema: {
                        type: "object",
                        properties: {
                            bucketName: {
                                type: "string",
                                description: "Name of the bucket to list measurements from",
                            },
                        },
                        required: ["bucketName"],
                    },
                },
                {
                    name: "execute-query",
                    description: "Execute a Flux query in InfluxDB",
                    inputSchema: {
                        type: "object",
                        properties: {
                            orgName: {
                                type: "string",
                                description: "Name of the organization to execute the query in",
                            },
                            fluxQuery: {
                                type: "string",
                                description: "Flux query string to execute",
                            },
                        },
                        required: ["orgName", "fluxQuery"],
                    },
                },
                {
                    name: "write-data",
                    description: "Write data to InfluxDB in line protocol format",
                    inputSchema: {
                        type: "object",
                        properties: {
                            org: {
                                type: "string",
                                description: "The organization name",
                            },
                            bucket: {
                                type: "string",
                                description: "The bucket name",
                            },
                            data: {
                                type: "string",
                                description: "Data in InfluxDB line protocol format",
                            },
                            precision: {
                                type: "string",
                                enum: ["ns", "us", "ms", "s"],
                                description: "Timestamp precision (ns, us, ms, s)",
                            },
                        },
                        required: ["org", "bucket", "data"],
                    },
                },
                {
                    name: "query-data",
                    description: "Query data from InfluxDB using Flux query language",
                    inputSchema: {
                        type: "object",
                        properties: {
                            org: {
                                type: "string",
                                description: "The organization name",
                            },
                            query: {
                                type: "string",
                                description: "Flux query string",
                            },
                        },
                        required: ["org", "query"],
                    },
                },
                {
                    name: "health-check",
                    description: "Check the health status of the InfluxDB instance",
                    inputSchema: {
                        type: "object",
                        properties: {},
                    },
                },
                {
                    name: "create-bucket",
                    description: "Create a new bucket in InfluxDB",
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "The bucket name",
                            },
                            orgID: {
                                type: "string",
                                description: "The organization ID",
                            },
                            retentionPeriodSeconds: {
                                type: "number",
                                description: "Retention period in seconds (optional)",
                            },
                        },
                        required: ["name", "orgID"],
                    },
                },
                {
                    name: "delete-bucket",
                    description: "Delete a bucket from InfluxDB",
                    inputSchema: {
                        type: "object",
                        properties: {
                            bucketId: {
                                type: "string",
                                description: "The bucketId",
                            },
                        },
                        required: ["bucketId"],
                    },
                },
                {
                    name: "create-org",
                    description: "Create a new organization in InfluxDB",
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "The organization name",
                            },
                            description: {
                                type: "string",
                                description: "Organization description (optional)",
                            },
                        },
                        required: ["name"],
                    },
                },
                {
                    name: "list-org-members",
                    description: "List members of an organization",
                    inputSchema: {
                        type: "object",
                        properties: {
                            orgID: {
                                type: "string",
                                description: "ID of the organization to list members from",
                            },
                        },
                        required: ["orgID"],
                    },
                },
                {
                    name: "remove-org-member",
                    description: "Remove a member from an organization",
                    inputSchema: {
                        type: "object",
                        properties: {
                            orgID: {
                                type: "string",
                                description: "ID of the organization",
                            },
                            userID: {
                                type: "string",
                                description: "ID of the user to remove",
                            },
                        },
                        required: ["orgID", "userID"],
                    },
                },
                {
                    name: "add-org-member",
                    description: "Add a member to an organization",
                    inputSchema: {
                        type: "object",
                        properties: {
                            orgID: {
                                type: "string",
                                description: "ID of the organization",
                            },
                            id: {
                                type: "string",
                                description: "ID of the user to add",
                            },
                            name: {
                                type: "string",
                                description: "Name of the user to add (optional)",
                            },
                        },
                        required: ["orgID", "id"],
                    },
                },
                {
                    name: "delete-org",
                    description: "Delete an organization from InfluxDB",
                    inputSchema: {
                        type: "object",
                        properties: {
                            orgId: {
                                type: "string",
                                description: "The organization ID",
                            },
                        },
                        required: ["orgId"],
                    },
                },
                {
                    name: "list-labels",
                    description: "List labels for an organization",
                    inputSchema: {
                        type: "object",
                        properties: {
                            orgID: {
                                type: "string",
                                description: "ID of the organization whose labels to list",
                            },
                        },
                        required: ["orgID"],
                    },
                },
                {
                    name: "create-label",
                    description: "Create a new label in an organization",
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "Name of the label",
                            },
                            orgID: {
                                type: "string",
                                description: "ID of the organization",
                            },
                            color: {
                                type: "string",
                                description: "Hex color code (e.g. 'ffb3b3')",
                            },
                            description: {
                                type: "string",
                                description: "Description of the label (optional)",
                            },
                        },
                        required: ["name", "orgID", "color"],
                    },
                },
                {
                    name: "delete-label",
                    description: "Delete a label from InfluxDB",
                    inputSchema: {
                        type: "object",
                        properties: {
                            labelID: {
                                type: "string",
                                description: "ID of the label to delete",
                            },
                        },
                        required: ["labelID"],
                    },
                },
                {
                    name: "update-label",
                    description: "Update an existing label",
                    inputSchema: {
                        type: "object",
                        properties: {
                            labelID: {
                                type: "string",
                                description: "ID of the label to update",
                            },
                            name: {
                                type: "string",
                                description: "Updated label name (optional)",
                            },
                            color: {
                                type: "string",
                                description: "Updated hex color code (optional)",
                            },
                            description: {
                                type: "string",
                                description: "Updated label description (optional)",
                            },
                        },
                        required: ["labelID"],
                    },
                },
                {
                    name: "list-tasks",
                    description: "List all tasks in InfluxDB",
                    inputSchema: {
                        type: "object",
                        properties: {},
                    },
                },
                {
                    name: "create-task",
                    description: "Create a new task in InfluxDB",
                    inputSchema: {
                        type: "object",
                        properties: {
                            description: {
                                type: "string",
                                description: "Optional description of the task",
                            },
                            flux: {
                                type: "string",
                                description: "Flux script to run for this task",
                            },
                            orgID: {
                                type: "string",
                                description: "Organization ID",
                            },
                        },
                        required: ["flux", "orgID"],
                    },
                },
                {
                    name: "add-label-to-task",
                    description: "Add a label to a task",
                    inputSchema: {
                        type: "object",
                        properties: {
                            taskID: {
                                type: "string",
                                description: "ID of the task",
                            },
                            labelID: {
                                type: "string",
                                description: "ID of the label to add",
                            },
                        },
                        required: ["taskID", "labelID"],
                    },
                },
                {
                    name: "list-task-labels",
                    description: "List labels associated with a task",
                    inputSchema: {
                        type: "object",
                        properties: {
                            taskID: {
                                type: "string",
                                description: "ID of the task",
                            },
                        },
                        required: ["taskID"],
                    },
                },
                {
                    name: "delete-label-from-task",
                    description: "Remove a label from a task",
                    inputSchema: {
                        type: "object",
                        properties: {
                            taskID: {
                                type: "string",
                                description: "ID of the task",
                            },
                            labelID: {
                                type: "string",
                                description: "ID of the label to delete",
                            },
                        },
                        required: ["taskID", "labelID"],
                    },
                },
                {
                    name: "update-task",
                    description: "Update an existing task",
                    inputSchema: {
                        type: "object",
                        properties: {
                            taskID: {
                                type: "string",
                                description: "ID of the task to update",
                            },
                            cron: {
                                type: "string",
                                description: "Cron schedule string (optional)",
                            },
                            description: {
                                type: "string",
                                description: "Updated description (optional)",
                            },
                            every: {
                                type: "string",
                                description: "Interval for running the task (e.g. '1h')",
                            },
                            flux: {
                                type: "string",
                                description: "Updated Flux script",
                            },
                            name: {
                                type: "string",
                                description: "Updated task name",
                            },
                            offset: {
                                type: "string",
                                description: "Offset before execution (optional)",
                            },
                            status: {
                                type: "string",
                                enum: ["active", "inactive"],
                                description: "Updated task status",
                            },
                        },
                        required: ["taskID"],
                    },
                },
                {
                    name: "flux-query-examples",
                    description: "Examples of Flux queries for InfluxDB",
                    inputSchema: {
                        type: "object",
                        properties: {},
                    },
                },
                {
                    name: "line-protocol-guide",
                    description: "Guide for writing data in InfluxDB line protocol format",
                    inputSchema: {
                        type: "object",
                        properties: {},
                    },
                },
            ],
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            // Add your InfluxDB connection check here if needed

            // check if the request has credentials
            const credentials = this.extractCredentialsFromRequest(request.params.arguments);
            if (!credentials) {
                throw new McpError(ErrorCode.InvalidRequest, "No valid credentials found in request body");
            }

            request.params.arguments.creds = credentials;

            if (!request.params.arguments.orgID && credentials.influxdb_default_org) {
                request.params.arguments.orgID = credentials.influxdb_default_org;
            } else if (!request.params.arguments.orgID && credentials.influxdb_default_org) {
                request.params.arguments.orgID = credentials.influxdb_default_org;
            }

            try {
                switch (request.params.name) {
                    case "list-organizations":
                        return await listOrganizations(request.params.arguments as unknown as { creds: any });
                    case "list-buckets":
                        return await listBuckets(request.params.arguments as unknown as { creds: any });
                    case "bucket-measurements":
                        return await bucketMeasurements(request.params.arguments as unknown as { creds: any; bucketName: string });
                    case "execute-query":
                        return await executeQuery(request.params.arguments as unknown as { creds: any; orgName: string; fluxQuery: string });
                    case "write-data":
                        return await writeData(request.params.arguments as unknown as { creds: any; org: string; bucket: string; data: string; precision: string });
                    case "query-data":
                        return await queryData(request.params.arguments as unknown as { creds: any; org: string; query: string });
                    case "health-check":
                        return await healthCheck(request.params.arguments as unknown as { creds: any });
                    case "create-bucket":
                        return await createBucket(request.params.arguments as unknown as { creds: any; name: string; orgID: string; retentionPeriodSeconds: number });
                    case "delete-bucket":
                        return await deleteBucket(request.params.arguments as unknown as { creds: any; bucketId: string });
                    case "create-org":
                        return await createOrg(request.params.arguments as unknown as { creds: any; name: string; description: string });
                    case "list-org-members":
                        return await listOrgMembers(request.params.arguments as unknown as { creds: any; orgID: string });
                    case "remove-org-member":
                        return await removeOrgMember(request.params.arguments as unknown as { creds: any; orgID: string; userID: string });
                    case "add-org-member":
                        return await addOrgMember(request.params.arguments as unknown as { creds: any; orgID: string; id: string; name: string });
                    case "delete-org":
                        return await deleteOrg(request.params.arguments as unknown as { creds: any; orgId: string });
                    case "list-labels":
                        return await listLabels(request.params.arguments as unknown as { creds: any; orgID: string });
                    case "create-label":
                        return await createLabel(request.params.arguments as unknown as { creds: any; name: string; orgID: string; color: string; description: string });
                    case "delete-label":
                        return await deleteLabel(request.params.arguments as unknown as { creds: any; labelID: string });
                    case "update-label":
                        return await updateLabel(request.params.arguments as unknown as { creds: any; labelID: string; name: string; color: string; description: string });
                    case "list-tasks":
                        return await listTasks(request.params.arguments as unknown as { creds: any });
                    case "create-task":
                        return await createTask(request.params.arguments as unknown as { creds: any; description: string; flux: string; orgID: string });
                    case "add-label-to-task":
                        return await addLabelToTask(request.params.arguments as unknown as { creds: any; taskID: string; labelID: string });
                    case "list-task-labels":
                        return await listTaskLabels(request.params.arguments as unknown as { creds: any; taskID: string });
                    case "delete-label-from-task":
                        return await deleteLabelFromTask(request.params.arguments as unknown as { creds: any; taskID: string; labelID: string });
                    case "update-task":
                        return await updateTask(
                            request.params.arguments as unknown as {
                                creds: any;
                                taskID: string;
                                cron?: string;
                                description?: string;
                                every?: string;
                                flux?: string;
                                name?: string;
                                offset?: string;
                                status?: string;
                            }
                        );
                    case "create-task":
                        return await createTask(request.params.arguments as unknown as { creds: any; description: string; flux: string; orgID: string });
                    case "flux-query-examples":
                        return await fluxQueryExamplesPrompt();
                    case "line-protocol-guide":
                        return await lineProtocolGuidePrompt();
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
                }
            } catch (error: any) {
                console.error(error);
                throw new McpError(ErrorCode.InternalError, `Error executing InfluxDB command: ${error.message}`);
            }
        });
    }

    async run() {
        // console.log("Starting MCP server with stdio transport...");
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
    }
}

const server = new InfluxDBServer();
server.run().catch(console.error);

// Add a global error handler
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    // Don't exit - just log the error, as this could be caught and handled elsewhere
});
