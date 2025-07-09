# Vercel MCP Server with Gemini AI

A comprehensive Model Context Protocol (MCP) server for Vercel API operations with integrated Gemini AI assistance.

## Features

### Core Vercel API Operations

- **Team Management**: Create, update, delete teams and manage members
- **Project Management**: Full project lifecycle management
- **Deployment Management**: Create, monitor, and manage deployments
- **Domain & DNS Management**: Domain operations and DNS record management
- **Environment & Configuration**: Environment variables and Edge Config management
- **Security & Access Control**: Access groups, auth tokens, and firewall management
- **Monitoring & Logging**: Log drains, webhooks, and analytics
- **Marketplace Integration**: Marketplace events and billing
- **Secrets & Environments**: Secure secret management
- **Artifacts & Aliases**: Artifact management and alias operations

### AI-Powered Features

- **Deployment Assistant**: Get AI-powered help with deployment issues
- **Project Optimizer**: AI recommendations for project optimization
- **Troubleshooting**: Intelligent deployment troubleshooting

## Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   VERCEL_TOKEN=your_vercel_token
   GEMINI_API_KEY=your_gemini_api_key
   TEAM_ID=your_default_team_id (optional)
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

### As an MCP Server

The server runs on stdio transport and can be configured with your MCP client.

### Available Tools

#### AI-Powered Tools

- `ai_deployment_assistant`: Get AI help with deployment questions
- `ai_project_optimizer`: Get AI recommendations for project optimization

#### Team Management

- `create_team`, `delete_team`, `get_team`, `list_teams`, `update_team`
- `list_team_members`, `invite_team_member`, `remove_team_member`, `update_team_member`

#### Project Management

- `list_projects`, `create_project`, `delete_project`, `update_project`, `pause_project`
- `add_project_member`, `list_project_members`, `remove_project_member`
- `request_project_transfer`, `accept_project_transfer`

#### Deployment Management

- `create_deployment`, `cancel_deployment`, `get_deployment`, `delete_deployment`, `list_deployment`
- `get_deployment_events`, `list_deployment_files`, `get_deployment_file`
- `promote_deployment`

#### Domain & DNS Management

- `add_domain`, `remove_domain`, `get_domain`, `list_domains`
- `domain_check`, `domain_price`, `domain_buy`
- `create_dns_record`, `delete_dns_record`, `list_dns_records`, `update_dns_record`

#### Environment & Configuration

- `add_env`, `update_env`, `delete_env`, `get_env`, `list_env`
- `create_edge_config`, `update_edge_config`, `delete_edge_config`, `get_edge_config`, `list_edge_configs`

#### Security & Access Control

- `create_access_group`, `delete_access_group`, `update_access_group`, `get_access_group`, `list_access_groups`
- `create_auth_token`, `delete_auth_token`, `get_auth_token`, `list_auth_tokens`
- `create_firewall_bypass`, `delete_firewall_bypass`, `get_firewall_config`, `update_firewall_config`

#### Monitoring & Logging

- `logdrain_create`, `logdrain_delete`, `logdrain_get`, `logdrain_list`
- `create_webhook`, `delete_webhook`, `list_webhooks`, `get_webhook`
- `send_web_vitals`

#### And many more...

## Configuration

### Environment Variables

- `VERCEL_TOKEN`: Your Vercel API token (required)
- `GEMINI_API_KEY`: Your Google Gemini API key (required)
- `TEAM_ID`: Default team ID for operations (optional)

### Getting API Keys

#### Vercel Token

1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Create a new token with appropriate scopes
3. Copy the token and set it as `VERCEL_TOKEN`

#### Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and set it as `GEMINI_API_KEY`

### MCP Client Configuration

#### For Claude Desktop:

```json
{
	"mcpServers": {
		"vercel": {
			"command": "node",
			"args": ["path/to/vercel-mcp-server/src/index.js"],
			"env": {
				"VERCEL_TOKEN": "your_vercel_token",
				"GEMINI_API_KEY": "your_gemini_api_key"
			}
		}
	}
}
```

#### For Cursor:

```json
{
	"mcpServers": {
		"vercel": {
			"command": "node",
			"args": ["path/to/vercel-mcp-server/src/index.js"],
			"env": {
				"VERCEL_TOKEN": "your_vercel_token",
				"GEMINI_API_KEY": "your_gemini_api_key"
			}
		}
	}
}
```

#### For Any MCP Client with Gemini AI:

```json
{
	"mcpServers": {
		"vercel-ai": {
			"command": "node",
			"args": ["src/index.js"],
			"cwd": "/path/to/vercel-mcp-server",
			"env": {
				"VERCEL_TOKEN": "your_vercel_token_here",
				"GEMINI_API_KEY": "your_gemini_api_key_here",
				"TEAM_ID": "your_team_id_optional"
			}
		}
	}
}
```

#### Using with Google AI Studio:

1. Install the MCP server: `npm install -g vercel-mcp-server`
2. Configure your AI client to use the server endpoint
3. Set environment variables for authentication
4. The server will automatically use Gemini AI for intelligent analysis

## Development

### Project Structure

```
src/
├── index.js # Main MCP server entry point
├── handlers/ # Tool handlers organized by category
│ ├── team-handlers.js
│ ├── project-handlers.js
│ ├── deployment-handlers.js
│ ├── ai-handlers.js
│ ├── domain-handlers.js
│ ├── environment-handlers.js
│ ├── security-handlers.js
│ ├── monitoring-handlers.js
│ ├── marketplace-handlers.js
│ ├── secret-handlers.js
│ ├── artifact-handlers.js
│ └── user-handlers.js
├── prompts/ # AI prompt templates
│ └── ai-prompts.ts
└── utils/ # Utility functions
    └── helpers.js
```

### Adding New Tools

1. Create or update the appropriate handler file in `src/handlers/`
2. Import and register the handler in `src/index.js`
3. Add any necessary utility functions to `src/utils/helpers.js`

## License

MIT License - see LICENSE file for details.
