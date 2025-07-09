#!/usr/bin/env node
import { exec, spawn } from "child_process";
import { promisify } from "util";

// Import the SDK
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from "@modelcontextprotocol/sdk/types.js";

// Redirect console.log and console.error to stderr to avoid interfering with MCP protocol messages
// MCP uses stdout for protocol communication
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

function configureLogger() {
    console.log = function () {
        process.stderr.write("[INFO] " + Array.from(arguments).join(" ") + "\n");
    };

    console.error = function () {
        process.stderr.write("[ERROR] " + Array.from(arguments).join(" ") + "\n");
    };
}

configureLogger();

const execAsync = promisify(exec);

interface ContainerArgs {
    all?: boolean;
}

interface RunContainerArgs {
    image: string;
    name?: string;
    keepAlive?: boolean;
    autoRemoveOnExit?: boolean;
    ports?: string[];
    volumes?: string[];
    env?: string[];
    command?: string;
}

interface ContainerActionArgs {
    container: string;
    force?: boolean;
}

interface ImageArgs {
    image: string;
}

class PodmanServer {
    private server: Server;

    constructor() {
        this.server = new Server(
            {
                name: "podman-mcp-server",
                version: "0.1.0",
            },
            {
                capabilities: {
                    tools: {},
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

    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: "list_containers",
                    description: "List all Podman containers",
                    inputSchema: {
                        type: "object",
                        properties: {
                            all: {
                                type: "boolean",
                                description: "Show all containers (default shows just running)",
                            },
                        },
                    },
                },
                {
                    name: "list_images",
                    description: "List all Podman images",
                    inputSchema: {
                        type: "object",
                        properties: {},
                    },
                },
                {
                    name: "run_container",
                    description: "Run a Podman container",
                    inputSchema: {
                        type: "object",
                        properties: {
                            image: {
                                type: "string",
                                description: "Podman image to run",
                            },
                            name: {
                                type: "string",
                                description: "Name for the container",
                            },
                            keepAlive: {
                                type: "boolean",
                                description: "Keep the container running in the background",
                                default: true,
                            },
                            autoRemoveOnExit: {
                                type: "boolean",
                                description: "Automatically remove the container when it exits",
                                default: false,
                            },
                            ports: {
                                type: "array",
                                items: {
                                    type: "string",
                                },
                                description: 'Port mappings (e.g. ["8080:80"])',
                            },
                            volumes: {
                                type: "array",
                                items: {
                                    type: "string",
                                },
                                description: 'Volume mappings (e.g. ["/host/path:/container/path"])',
                            },
                            env: {
                                type: "array",
                                items: {
                                    type: "string",
                                },
                                description: 'Environment variables (e.g. ["KEY=value"])',
                            },
                            command: {
                                type: "string",
                                description: "Command to run in the container",
                            },
                        },
                        required: ["image"],
                    },
                },
                {
                    name: "stop_container",
                    description: "Stop a running Podman container",
                    inputSchema: {
                        type: "object",
                        properties: {
                            container: {
                                type: "string",
                                description: "Container ID or name",
                            },
                        },
                        required: ["container"],
                    },
                },
                {
                    name: "remove_container",
                    description: "Remove a Podman container",
                    inputSchema: {
                        type: "object",
                        properties: {
                            container: {
                                type: "string",
                                description: "Container ID or name",
                            },
                            force: {
                                type: "boolean",
                                description: "Force removal of running container",
                            },
                        },
                        required: ["container"],
                    },
                },
                {
                    name: "pull_image",
                    description: "Pull a Podman image from a registry",
                    inputSchema: {
                        type: "object",
                        properties: {
                            image: {
                                type: "string",
                                description: 'Image name (e.g. "nginx:latest")',
                            },
                        },
                        required: ["image"],
                    },
                },
                //
                {
                    name: "prune_unused",
                    description: "Prune unused containers, images, volumes, and networks",
                    inputSchema: {
                        type: "object",
                        properties: {
                            all: {
                                type: "boolean",
                                description: "Remove all unused resources (default: safe prune)",
                            },
                        },
                    },
                },

                {
                    name: "exec_in_container",
                    description: "Execute a command in a running container",
                    inputSchema: {
                        type: "object",
                        properties: {
                            container: {
                                type: "string",
                                description: "Container ID or name",
                            },
                            command: {
                                type: "string",
                                description: "Command to execute",
                            },
                        },
                        required: ["container", "command"],
                    },
                },
                {
                    name: "remove_image",
                    description: "Remove a Podman image",
                    inputSchema: {
                        type: "object",
                        properties: {
                            image: {
                                type: "string",
                                description: "Image name or ID",
                            },
                            force: {
                                type: "boolean",
                                description: "Force removal even if used by containers",
                            },
                        },
                        required: ["image"],
                    },
                },
                {
                    name: "restart_container",
                    description: "Restart a Podman container",
                    inputSchema: {
                        type: "object",
                        properties: {
                            container: {
                                type: "string",
                                description: "Container ID or name",
                            },
                        },
                        required: ["container"],
                    },
                },
                {
                    name: "build_image",
                    description: "Build a Podman image from a Dockerfile",
                    inputSchema: {
                        type: "object",
                        properties: {
                            contextPath: {
                                type: "string",
                                description: "Path to the build context",
                            },
                            dockerfile: {
                                type: "string",
                                description: "Optional path to Dockerfile",
                            },
                            tag: {
                                type: "string",
                                description: "Tag for the built image",
                            },
                        },
                        required: ["contextPath"],
                    },
                },
            ],
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            // check if Podman is installed
            const isPodmanInstalled = await this.checkPodmanInstalled();
            if (!isPodmanInstalled) {
                throw new McpError(ErrorCode.InternalError, "Podman is not installed or not running.");
            }

            try {
                switch (request.params.name) {
                    case "list_containers":
                        return await this.listContainers(request.params.arguments as unknown as ContainerArgs);
                    case "list_images":
                        return await this.listImages();
                    case "run_container":
                        return await this.runContainer(request.params.arguments as unknown as RunContainerArgs);
                    case "stop_container":
                        return await this.stopContainer(request.params.arguments as unknown as ContainerActionArgs);
                    case "remove_container":
                        return await this.removeContainer(request.params.arguments as unknown as ContainerActionArgs);
                    case "pull_image":
                        return await this.pullImage(request.params.arguments as unknown as ImageArgs);
                    case "prune_unused":
                        return await this.pruneUnused(request.params.arguments as unknown as { all?: boolean });
                    case "exec_in_container":
                        return await this.execInContainer(request.params.arguments as unknown as { container: string; command: string });
                    case "remove_image":
                        return await this.removeImage(request.params.arguments as unknown as { image: string; force?: boolean });
                    case "restart_container":
                        return await this.restartContainer(request.params.arguments as unknown as { container: string });
                    case "build_image":
                        return await this.buildImage(request.params.arguments as unknown as { contextPath: string; dockerfile?: string; tag?: string });
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
                }
            } catch (error: any) {
                console.error(error);
                throw new McpError(ErrorCode.InternalError, `Error executing Podman command: ${error.message}`);
            }
        });
    }

    private async checkPodmanInstalled(): Promise<boolean> {
        try {
            const { stdout: versionOutput } = await execAsync("podman --version");
            return true;
        } catch (err: any) {
            let message = "❌ Podman is not installed or not running.\n";

            if (err.message.includes("command not found") || err.code === "ENOENT") {
                message += "Reason: Podman binary not found in PATH.";
            } else if (err.stderr?.includes("permission denied")) {
                message += "Reason: Permission denied. Try running as a user with Podman access.";
            } else {
                message += `Error: ${err.message || "Unknown"}`;
            }
            return false;
        }
    }

    // Input sanitization utility functions
    private sanitizeDockerName(name: string): string {
        // Podman names can only contain alphanumeric characters, hyphens, underscores, and dots
        if (!/^[a-zA-Z0-9_.-]+$/.test(name)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid Podman name format. Only alphanumeric characters, hyphens, underscores, and dots are allowed.");
        }
        return name;
    }

    private sanitizeDockerImage(image: string): string {
        // 1. Validate image format
        if (!/^[a-zA-Z0-9_.\-/:]+$/.test(image)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid Podman image format.");
        }

        // 2. Parse parts
        const parts = image.split("/");
        const first = parts[0];

        // 3. Determine if registry is specified (contains '.' or ':')
        const hasRegistry = first.includes(".");

        // 4. If no registry specified, assume docker.io
        if (!hasRegistry) {
            const repoPath = parts.length === 1 ? `library/${parts[0]}` : parts.join("/");
            // Add :latest if no tag is provided
            if (!repoPath.includes(":")) {
                return `docker.io/${repoPath}:latest`;
            }
            return `docker.io/${repoPath}`;
        }

        // 5. Return original if registry is defined
        return image;
    }

    private sanitizeDockerTag(tag: string): string {
        // Podman tags can contain alphanumeric characters, hyphens, underscores, and dots
        if (!/^[a-zA-Z0-9_.-]+$/.test(tag)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid Podman tag format.");
        }
        return tag;
    }

    private sanitizeFilePath(path: string): string {
        // Basic path sanitization - prevent command injection
        if (path.includes("`") || path.includes("$") || path.includes(";") || path.includes("|") || path.includes("&")) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid path format. Special characters not allowed.");
        }
        return path;
    }

    private sanitizePortMapping(port: string): string {
        // Port mappings should be in format like "8080:80" or "8080"
        if (!/^\d+:\d+$|^\d+$/.test(port)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid port mapping format. Use format like '8080:80' or '8080'.");
        }
        return port;
    }

    private sanitizeVolumeMapping(volume: string): string {
        // Volume mappings should be in format like "/host/path:/container/path" or "volume_name:/container/path"
        if (volume.includes("`") || volume.includes("$") || volume.includes(";") || volume.includes("|") || volume.includes("&")) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid volume mapping format. Special characters not allowed.");
        }
        return volume;
    }

    private sanitizeEnvVar(env: string): string {
        // Environment variables should be in format "KEY=value"
        if (!/^[A-Z_][A-Z0-9_]*=.*$/.test(env)) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid environment variable format. Use format like 'KEY=value'.");
        }
        // Additional check for command injection
        if (env.includes("`") || env.includes("$") || env.includes(";") || env.includes("|") || env.includes("&")) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid environment variable value. Special characters not allowed.");
        }
        return env;
    }

    private sanitizeCommand(command: string): string {
        // Very basic sanitization for commands - you might want to be more restrictive
        if (command.includes("`") || command.includes(";") || command.includes("|") || command.includes("&")) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid command format. Special characters not allowed.");
        }
        return command;
    }

    private async listContainers(args: ContainerArgs) {
        try {
            const showAll = args?.all === true ? "-a" : "";
            const { stdout } = await execAsync(`podman ps ${showAll} --format "{{.ID}}\\t{{.Image}}\\t{{.Status}}\\t{{.Names}}"`);

            const containers = stdout
                .trim()
                .split("\n")
                .filter((line) => line.trim() !== "")
                .map((line) => {
                    const [id, image, status, name] = line.split("\t");
                    return { id, image, status, name };
                });

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(containers, null, 2),
                    },
                ],
            };
        } catch (error: any) {
            throw new McpError(ErrorCode.InternalError, `Failed to list containers: ${error.message || "Unknown error"}`);
        }
    }

    private async listImages() {
        try {
            const { stdout } = await execAsync('podman images --format "{{.Repository}}:{{.Tag}}\\t{{.ID}}\\t{{.Size}}"');

            const images = stdout
                .trim()
                .split("\n")
                .filter((line) => line.trim() !== "")
                .map((line) => {
                    const [name, id, size] = line.split("\t");
                    return { name, id, size };
                });

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(images, null, 2),
                    },
                ],
            };
        } catch (error: any) {
            throw new McpError(ErrorCode.InternalError, `Failed to list images: ${error.message || "Unknown error"}`);
        }
    }

    private async restartContainer(input: { container: string }) {
        try {
            const { container } = input;

            if (!container) {
                throw new McpError(ErrorCode.InvalidParams, "Container parameter is required");
            }

            const sanitizedContainer = this.sanitizeDockerName(container);
            await execAsync(`podman restart ${sanitizedContainer}`);

            return {
                content: [
                    {
                        type: "text",
                        text: `Container ${container} restarted successfully.`,
                    },
                ],
            };
        } catch (error: any) {
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to restart container: ${error.message || "Unknown error"}`);
        }
    }

    private async removeImage(input: { image: string; force?: boolean }) {
        try {
            const { image, force = false } = input;

            if (!image) {
                throw new McpError(ErrorCode.InvalidParams, "Image parameter is required");
            }

            const sanitizedImage = this.sanitizeDockerImage(image);
            const cmd = `podman rmi ${force ? "--force " : ""}${sanitizedImage}`;
            await execAsync(cmd);

            return {
                content: [
                    {
                        type: "text",
                        text: `Image ${image} removed successfully.`,
                    },
                ],
            };
        } catch (error: any) {
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to remove image: ${error.message || "Unknown error"}`);
        }
    }

    private async buildImage(input: { contextPath: string; dockerfile?: string; tag?: string }) {
        try {
            const { contextPath, dockerfile, tag } = input;

            if (!contextPath) {
                throw new McpError(ErrorCode.InvalidParams, "Context path parameter is required");
            }

            const sanitizedContextPath = this.sanitizeFilePath(contextPath);
            const tagOption = tag ? `-t ${this.sanitizeDockerTag(tag)}` : "";
            const dockerfileOption = dockerfile ? `-f ${this.sanitizeFilePath(dockerfile)}` : "";
            const cmd = `podman build ${tagOption} ${dockerfileOption} ${sanitizedContextPath}`;

            const { stdout } = await execAsync(cmd);

            return {
                content: [
                    {
                        type: "text",
                        text: stdout,
                    },
                ],
            };
        } catch (error: any) {
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to build image: ${error.message || "Unknown error"}`);
        }
    }

    private async execInContainer(input: { container: string; command: string }) {
        try {
            const { container, command } = input;

            if (!container) {
                throw new McpError(ErrorCode.InvalidParams, "Container parameter is required");
            }

            if (!command) {
                throw new McpError(ErrorCode.InvalidParams, "Command parameter is required");
            }

            const sanitizedContainer = this.sanitizeDockerName(container);
            const sanitizedCommand = this.sanitizeCommand(command);
            const { stdout } = await execAsync(`podman exec ${sanitizedContainer} ${sanitizedCommand}`);

            return {
                content: [
                    {
                        type: "text",
                        text: stdout,
                    },
                ],
            };
        } catch (error: any) {
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to execute command in container: ${error.message || "Unknown error"}`);
        }
    }

    private async pruneUnused(input: { all?: boolean }) {
        try {
            const { all = false } = input;
            const pruneCommand = all ? "podman system prune -a -f" : "podman system prune -f";
            const { stdout } = await execAsync(pruneCommand);

            return {
                content: [
                    {
                        type: "text",
                        text: stdout,
                    },
                ],
            };
        } catch (error: any) {
            throw new McpError(ErrorCode.InternalError, `Failed to prune unused resources: ${error.message || "Unknown error"}`);
        }
    }

    private async runContainer(args: RunContainerArgs) {
        try {
            if (!args.image) {
                throw new McpError(ErrorCode.InvalidParams, "Image parameter is required");
            }

            const sanitizedImage = this.sanitizeDockerImage(args.image);
            let command = "podman run -d";

            if (args.autoRemoveOnExit) {
                command += " --rm";
            }

            if (args.keepAlive && !args.command) {
                command += " -it";
            }

            if (args.name) {
                const sanitizedName = this.sanitizeDockerName(args.name);
                command += ` --name ${sanitizedName}`;
            }

            if (args.ports && Array.isArray(args.ports)) {
                args.ports.forEach((port: string) => {
                    const sanitizedPort = this.sanitizePortMapping(port);
                    command += ` -p ${sanitizedPort}`;
                });
            }

            if (args.volumes && Array.isArray(args.volumes)) {
                args.volumes.forEach((volume: string) => {
                    const sanitizedVolume = this.sanitizeVolumeMapping(volume);
                    command += ` -v ${sanitizedVolume}`;
                });
            }

            if (args.env && Array.isArray(args.env)) {
                args.env.forEach((env: string) => {
                    const sanitizedEnv = this.sanitizeEnvVar(env);
                    command += ` -e ${sanitizedEnv}`;
                });
            }

            command += ` ${sanitizedImage}`;

            if (args.command) {
                const sanitizedCommand = this.sanitizeCommand(args.command);
                command += ` ${sanitizedCommand}`;
            }

            const { stdout } = await execAsync(command);

            return {
                content: [
                    {
                        type: "text",
                        text: `Container started\n• Name: ${args.name || "N/A"}\n• ID: ${stdout.trim()}\n• Image: ${sanitizedImage}\n${
                            args.command ? "" : args.keepAlive ? "Running in keep-alive mode" : ""
                        }`,
                    },
                ],
            };
        } catch (error: any) {
            if (error instanceof McpError) throw error;
            throw new McpError(ErrorCode.InternalError, `Failed to run container: ${error.message || "Unknown error"}`);
        }
    }

    private async stopContainer(args: ContainerActionArgs) {
        try {
            if (!args.container) {
                throw new McpError(ErrorCode.InvalidParams, "Container parameter is required");
            }

            const sanitizedContainer = this.sanitizeDockerName(args.container);
            const { stdout } = await execAsync(`podman stop ${sanitizedContainer}`);

            return {
                content: [
                    {
                        type: "text",
                        text: stdout.trim(),
                    },
                ],
            };
        } catch (error: any) {
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to stop container: ${error.message || "Unknown error"}`);
        }
    }

    private async removeContainer(args: ContainerActionArgs) {
        try {
            if (!args.container) {
                throw new McpError(ErrorCode.InvalidParams, "Container parameter is required");
            }

            const sanitizedContainer = this.sanitizeDockerName(args.container);
            const force = args.force === true ? " -f" : "";
            const { stdout } = await execAsync(`podman rm${force} ${sanitizedContainer}`);

            return {
                content: [
                    {
                        type: "text",
                        text: stdout.trim(),
                    },
                ],
            };
        } catch (error: any) {
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to remove container: ${error.message || "Unknown error"}`);
        }
    }

    private async pullImage(args: { image: string }): Promise<{ content: { type: string; text: string }[] }> {
        try {
            const image = args.image?.trim();

            if (!image) {
                throw new McpError(ErrorCode.InvalidParams, "The 'image' parameter is required and cannot be empty.");
            }

            const sanitizedImage = this.sanitizeDockerImage(image);

            return new Promise((resolve, reject) => {
                try {
                    const pullProcess = spawn("podman", ["pull", sanitizedImage]);

                    let stdoutBuffer = "";
                    let stderrBuffer = "";
                    let finished = false;

                    pullProcess.stdout.on("data", (data) => {
                        stdoutBuffer += data.toString();
                    });

                    pullProcess.stderr.on("data", (data) => {
                        stderrBuffer += data.toString();
                    });

                    pullProcess.on("close", (code) => {
                        finished = true;
                        const output = code === 0 ? stdoutBuffer.trim() : stderrBuffer.trim();

                        if (code === 0) {
                            resolve({
                                content: [
                                    {
                                        type: "text",
                                        text: `Podman image '${image}' pulled successfully:\n\n${output}`,
                                    },
                                ],
                            });
                        } else {
                            reject(new McpError(ErrorCode.InternalError, `Failed to pull Podman image '${image}': ${output}`));
                        }
                    });

                    pullProcess.on("error", (error) => {
                        finished = true;
                        reject(new McpError(ErrorCode.InternalError, `Failed to start Podman pull process: ${error.message}`));
                    });

                    // Timeout for few seconds to check if process is still running
                    setTimeout(() => {
                        if (!finished) {
                            resolve({
                                content: [
                                    {
                                        type: "text",
                                        text: `Started pulling Podman image '${image}'...\nStill in progress after 8 seconds.\nRun "list_images" later to check if it's available.`,
                                    },
                                ],
                            });
                        }
                    }, 8000);
                } catch (err: any) {
                    reject(new McpError(ErrorCode.InternalError, `Failed to start pulling Podman image '${image}': ${err.message || "Unknown error"}`));
                }
            });
        } catch (error: any) {
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to pull image: ${error.message || "Unknown error"}`);
        }
    }

    async run() {
        // console.error("Podman MCP server running on stdio");
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
    }
}

const server = new PodmanServer();
server.run().catch(console.error);
