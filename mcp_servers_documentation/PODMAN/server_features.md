# Podman MCP Server Overview

## What is the Podman MCP Server?
The Podman MCP Server is a connector within the Vanij Platform that enables seamless interaction with Podman containers and images through the local Podman CLI. It provides comprehensive container lifecycle management without requiring additional credentials or authentication.

---

## Key Features
- ✅ Manage containers (run, stop, restart, remove)
- ✅ Handle images (pull, build, remove, list)
- ✅ Execute commands inside running containers
- ✅ Configure port mappings and volume mounts
- ✅ Set environment variables and runtime options
- ✅ Prune unused resources for cleanup
- ✅ Build custom images from Dockerfiles

---

## Capabilities

| Capability           | Description                                       |
|----------------------|---------------------------------------------------|
| Container Management | Full lifecycle control of Podman containers      |
| Image Operations     | Pull, build, remove, and list container images   |
| Resource Configuration| Configure ports, volumes, and environment vars  |
| Command Execution    | Execute commands inside running containers        |
| Resource Cleanup     | Prune unused containers, images, and volumes     |
| Custom Builds        | Build images from Dockerfiles                    |

---

## Tool Categories

### **Container Operations**
- `list_containers` - List all containers (running or all)
- `run_container` - Create and run new containers
- `stop_container` - Stop running containers
- `restart_container` - Restart existing containers
- `remove_container` - Delete containers (with force option)
- `exec_in_container` - Execute commands in running containers

### **Image Management**
- `list_images` - View all available images
- `pull_image` - Download images from registries
- `build_image` - Build custom images from Dockerfiles
- `remove_image` - Delete images (with force option)

### **System Maintenance**
- `prune_unused` - Clean up unused resources

---

## Supported Podman Versions
- Podman 3.0+
- Compatible with both rootful and rootless Podman
- Supports all major container registries
- Works with custom Dockerfiles and build contexts

---

## Security Notes
- **No credentials required** - Uses local Podman CLI
- Inherits user permissions from local Podman installation
- Supports rootless containers for enhanced security
- All operations execute within local environment
- No network authentication needed

---

## Integration Use Cases
- Development environment management
- Local testing and debugging
- Microservices orchestration
- Container-based CI/CD workflows
- Application deployment automation
- Development stack provisioning
- Container lifecycle automation

---

## Prerequisites
- Podman installed and configured locally
- User permissions to run Podman commands
- Network connectivity for pulling images from registries
- Sufficient disk space for containers and images

---

## Example Workflows

### Basic Container Management
1. Pull an image using `pull_image`
2. Run a container with `run_container` (configure ports/volumes)
3. Execute commands using `exec_in_container`
4. Stop and remove when done

### Development Environment Setup
1. Build custom image using `build_image` with Dockerfile
2. Run container with volume mounts for live development
3. Execute development commands inside container
4. Restart container as needed during development

### System Maintenance
1. List all containers and images
2. Stop unused containers
3. Use `prune_unused` to clean up resources
4. Remove old images to free disk space

---

## Advanced Configuration Options

### Container Runtime Options
- **Port Mappings**: Map host ports to container ports
- **Volume Mounts**: Mount host directories into containers
- **Environment Variables**: Set runtime environment configuration
- **Keep Alive**: Configure container persistence behavior
- **Auto Remove**: Automatically clean up containers on exit

### Image Building
- **Build Context**: Specify directory containing Dockerfile
- **Custom Dockerfile**: Use non-standard Dockerfile names
- **Image Tags**: Assign custom tags to built images
- **Multi-stage Builds**: Support for complex build processes

---

## Common Use Cases

### Web Development
```
1. Pull nginx image
2. Run with port mapping (8080:80)
3. Mount local web files as volume
4. Execute configuration commands
```

### Database Development
```
1. Pull database image (PostgreSQL, MySQL, etc.)
2. Run with persistent volume for data
3. Set environment variables for credentials
4. Execute database commands as needed
```

### Build Automation
```
1. Build application image from Dockerfile
2. Run automated tests in container
3. Execute deployment scripts
4. Clean up resources after completion
```