import { makeVercelRequest, validateParams, formatResponse, generateDeploymentPrompt, generateOptimizationPrompt, generateSecurityPrompt } from "../utils/helpers.js";

const aiHandlers = {
    ai_deployment_assistant: {
        description: "Get AI-powered assistance for deployment planning and troubleshooting",
        inputSchema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Your deployment question or issue",
                },
                context: {
                    type: "string",
                    description: "Additional context about your project",
                },
            },
            required: ["query"],
        },
        execute: async (args, context) => {
            try {
                validateParams(args, ["query"]);

                const model = context.genAI.getGenerativeModel({ model: "gemini-pro" });
                const prompt = generateDeploymentPrompt(args.query, args.context);

                const result = await model.generateContent(prompt);
                const response = result.response.text();

                return {
                    content: [
                        {
                            type: "text",
                            text: `AI Deployment Assistant:\n\n${response}`,
                        },
                    ],
                };
            } catch (error) {
                throw new Error(`AI assistant error: ${error.message}`);
            }
        },
    },

    ai_project_optimizer: {
        description: "Get AI recommendations for optimizing your Vercel projects",
        inputSchema: {
            type: "object",
            properties: {
                projectId: {
                    type: "string",
                    description: "Project ID to analyze",
                },
                teamId: {
                    type: "string",
                    description: "Team ID (optional)",
                },
            },
            required: ["projectId"],
        },
        execute: async (args, context) => {
            try {
                validateParams(args, ["projectId"]);

                // Get project details
                const params = {};
                if (args.teamId) {
                    params.teamId = args.teamId;
                }

                const project = await makeVercelRequest(`/v9/projects/${args.projectId}`, {
                    params,
                    token: context.vercelToken,
                });

                // Get recent deployments
                const deployments = await makeVercelRequest("/v6/deployments", {
                    params: { projectId: args.projectId, limit: 10, ...params },
                    token: context.vercelToken,
                });

                const model = context.genAI.getGenerativeModel({ model: "gemini-pro" });
                const prompt = generateOptimizationPrompt(project, deployments);

                const result = await model.generateContent(prompt);
                const response = result.response.text();

                return {
                    content: [
                        {
                            type: "text",
                            text: `AI Project Optimization Recommendations:\n\n${response}`,
                        },
                    ],
                };
            } catch (error) {
                throw new Error(`Project optimization error: ${error.message}`);
            }
        },
    },

    ai_troubleshoot_deployment: {
        description: "Get AI-powered troubleshooting for deployment issues",
        inputSchema: {
            type: "object",
            properties: {
                deploymentId: {
                    type: "string",
                    description: "Deployment ID to troubleshoot",
                },
                teamId: {
                    type: "string",
                    description: "Team ID (optional)",
                },
                issueDescription: {
                    type: "string",
                    description: "Description of the issue you're experiencing",
                },
            },
            required: ["deploymentId"],
        },
        execute: async (args, context) => {
            try {
                validateParams(args, ["deploymentId"]);

                // Get deployment details
                const params = {};
                if (args.teamId) {
                    params.teamId = args.teamId;
                }

                const deployment = await makeVercelRequest(`/v13/deployments/${args.deploymentId}`, {
                    params,
                    token: context.vercelToken,
                });

                // Get deployment events
                let events = [];
                try {
                    events = await makeVercelRequest(`/v3/deployments/${args.deploymentId}/events`, {
                        params,
                        token: context.vercelToken,
                    });
                } catch (error) {
                    console.warn("Could not fetch deployment events:", error.message);
                }

                const model = context.genAI.getGenerativeModel({ model: "gemini-pro" });

                const prompt = `Troubleshoot this Vercel deployment issue:

Deployment ID: ${args.deploymentId}
Deployment Details: ${JSON.stringify(deployment, null, 2)}
Events/Logs: ${JSON.stringify(events, null, 2)}
${args.issueDescription ? `Issue Description: ${args.issueDescription}` : ""}

Provide:
1. Root cause analysis
2. Specific error identification
3. Step-by-step resolution
4. Prevention strategies
5. Related documentation links

Focus on actionable solutions.`;

                const result = await model.generateContent(prompt);
                const response = result.response.text();

                return {
                    content: [
                        {
                            type: "text",
                            text: `AI Deployment Troubleshooting:\n\n${response}`,
                        },
                    ],
                };
            } catch (error) {
                throw new Error(`Troubleshooting error: ${error.message}`);
            }
        },
    },

    ai_analyze_project_code: {
        description: "Get AI analysis of your project's code structure and recommendations",
        inputSchema: {
            type: "object",
            properties: {
                projectId: {
                    type: "string",
                    description: "Project ID to analyze",
                },
                teamId: {
                    type: "string",
                    description: "Team ID (optional)",
                },
                focusArea: {
                    type: "string",
                    enum: ["performance", "security", "best-practices", "optimization", "all"],
                    description: "Specific area to focus analysis on",
                    default: "all",
                },
            },
            required: ["projectId"],
        },
        execute: async (args, context) => {
            try {
                validateParams(args, ["projectId"]);

                // Get project details
                const params = {};
                if (args.teamId) {
                    params.teamId = args.teamId;
                }

                const project = await makeVercelRequest(`/v9/projects/${args.projectId}`, {
                    params,
                    token: context.vercelToken,
                });

                const model = context.genAI.getGenerativeModel({ model: "gemini-pro" });

                const prompt = `Analyze this Vercel project code structure and provide recommendations:

Project: ${JSON.stringify(project, null, 2)}
Focus Area: ${args.focusArea}

Based on the project configuration, framework, and settings, provide detailed analysis for:

${
    args.focusArea === "performance" || args.focusArea === "all"
        ? `
PERFORMANCE ANALYSIS:
- Bundle size optimization opportunities
- Build time improvements
- Runtime performance enhancements
- Caching strategies
`
        : ""
}

${
    args.focusArea === "security" || args.focusArea === "all"
        ? `
SECURITY ANALYSIS:
- Environment variable security
- Dependency vulnerabilities
- Authentication and authorization
- HTTPS and SSL configuration
`
        : ""
}

${
    args.focusArea === "best-practices" || args.focusArea === "all"
        ? `
BEST PRACTICES REVIEW:
- Code organization and structure
- Framework-specific recommendations
- Deployment configuration
- Monitoring and logging setup
`
        : ""
}

${
    args.focusArea === "optimization" || args.focusArea === "all"
        ? `
OPTIMIZATION OPPORTUNITIES:
- Resource utilization
- Cost optimization
- Developer experience improvements
- CI/CD pipeline enhancements
`
        : ""
}

Provide specific, actionable recommendations with implementation steps.`;

                const result = await model.generateContent(prompt);
                const response = result.response.text();

                return {
                    content: [
                        {
                            type: "text",
                            text: `AI Code Analysis (${args.focusArea}):\n\n${response}`,
                        },
                    ],
                };
            } catch (error) {
                throw new Error(`Code analysis error: ${error.message}`);
            }
        },
    },

    ai_security_audit: {
        description: "Get AI-powered security audit and recommendations for your project",
        inputSchema: {
            type: "object",
            properties: {
                projectId: {
                    type: "string",
                    description: "Project ID to audit",
                },
                teamId: {
                    type: "string",
                    description: "Team ID (optional)",
                },
                auditType: {
                    type: "string",
                    enum: ["basic", "comprehensive", "compliance"],
                    description: "Type of security audit",
                    default: "basic",
                },
            },
            required: ["projectId"],
        },
        execute: async (args, context) => {
            try {
                validateParams(args, ["projectId"]);

                // Get project details
                const params = {};
                if (args.teamId) {
                    params.teamId = args.teamId;
                }

                const project = await makeVercelRequest(`/v9/projects/${args.projectId}`, {
                    params,
                    token: context.vercelToken,
                });

                // Get environment variables
                let envVars = { envs: [] };
                try {
                    envVars = await makeVercelRequest(`/v9/projects/${args.projectId}/env`, {
                        params,
                        token: context.vercelToken,
                    });
                } catch (error) {
                    console.warn("Could not fetch environment variables:", error.message);
                }

                const model = context.genAI.getGenerativeModel({ model: "gemini-pro" });
                const prompt = generateSecurityPrompt(project, envVars, args.auditType);

                const result = await model.generateContent(prompt);
                const response = result.response.text();

                return {
                    content: [
                        {
                            type: "text",
                            text: `AI Security Audit (${args.auditType}):\n\n${response}`,
                        },
                    ],
                };
            } catch (error) {
                throw new Error(`Security audit error: ${error.message}`);
            }
        },
    },
};

export { aiHandlers };
