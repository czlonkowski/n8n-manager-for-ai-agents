# n8n Manager for AI Agents

> [!IMPORTANT]
> **This repository is no longer being actively developed.** The n8n instance management tools have been integrated into the more comprehensive [n8n-mcp](https://github.com/czlonkowski/n8n-mcp) project, which provides a complete solution for n8n automation with AI agents.
>
> Please use [n8n-mcp](https://github.com/czlonkowski/n8n-mcp) for the latest features and updates.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.13.1-purple)](https://modelcontextprotocol.io)
[![n8n API](https://img.shields.io/badge/n8n%20API-v1-orange)](https://docs.n8n.io/api/)

A Model Context Protocol (MCP) server that enables Claude Desktop and other AI agents to manage n8n workflow automation instances through the n8n API.

## 🎯 Project Overview

This MCP server provides AI agents with tools to manage n8n workflows programmatically. It implements the core n8n API operations with intelligent workarounds for API limitations.

### ✅ What's Working

- **Workflow Management**: Create, read, update, and delete workflows
- **Execution Monitoring**: List and view execution details, delete execution records
- **Webhook Triggers**: Execute workflows via webhook endpoints
- **Health Monitoring**: Check n8n instance connectivity and configuration

### 🚧 Current Limitations

- **Workflow Activation**: Cannot activate/deactivate workflows via API (manual UI activation required)
- **Direct Execution**: Not available - must use webhook triggers
- **Tags & Credentials**: Read-only fields, cannot be set via API

## 🚀 Implemented Features

- **Workflow Operations**: Full CRUD operations for n8n workflows
- **Execution Management**: View, list, and delete execution records
- **Webhook-Based Execution**: Trigger workflows via webhook URLs
- **Smart Error Handling**: Automatic removal of read-only fields, method fallbacks
- **AI-Friendly Descriptions**: Enhanced tool descriptions with examples and clear limitations
- **Cursor-Based Pagination**: Efficient handling of large result sets
- **Health Monitoring**: Built-in connectivity and configuration checks

## ⚠️ API Limitations & Workarounds

### Discovered Limitations
- **Workflow Activation**: The `active` field is read-only - workflows must be activated manually in the UI
- **Tags Field**: Read-only during creation and updates
- **PATCH Method**: Some n8n instances don't support PATCH for workflow updates
- **Direct Execution**: Must use webhook triggers (no direct execution API)
- **Settings Field**: Required but undocumented - we provide sensible defaults

### Not Implemented (API Unavailable)
- **User Management**: No public API endpoints
- **Credential Management**: Limited API, schemas not exposed
- **Stop Execution**: Cannot stop running executions via API
- **Variables**: Only available through source control API
- **Import/Export**: Planned but not yet implemented

## 📦 Available MCP Tools

### Workflow Management
- `n8n_create_workflow` - Create new workflows with nodes and connections
- `n8n_get_workflow` - Retrieve workflow details by ID
- `n8n_update_workflow` - Update existing workflows (requires full node list)
- `n8n_delete_workflow` - Delete workflows permanently
- `n8n_list_workflows` - List workflows with filtering and pagination

### Execution Management
- `n8n_trigger_webhook_workflow` - Trigger workflows via webhook URL
- `n8n_get_execution` - Get detailed execution information
- `n8n_list_executions` - List executions with status filtering
- `n8n_delete_execution` - Delete execution records

### System Tools
- `n8n_health_check` - Check API connectivity and configuration

## 🛠️ Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.0
- **MCP SDK**: @modelcontextprotocol/sdk v1.13.1
- **HTTP Client**: Axios with retry logic
- **Validation**: Zod schemas
- **Logging**: Winston (file-based in MCP mode)
- **Build**: TypeScript with ES modules

## 📋 Prerequisites

- Node.js 20 or higher
- n8n instance with API access enabled
- n8n API key
- Claude Desktop (for MCP integration)

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/czlonkowski/n8n-manager-for-ai-agents
   cd n8n-manager-for-ai-agents
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your n8n instance details
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Configure Claude Desktop**
   Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):
   ```json
   {
     "mcpServers": {
       "n8n-manager": {
         "command": "node",
         "args": ["/absolute/path/to/n8n-manager-for-ai-agents/build/index.js"],
         "env": {
           "N8N_API_URL": "https://your-n8n-instance.com",
           "N8N_API_KEY": "your-api-key",
           "LOG_LEVEL": "info",
           "NODE_ENV": "production",
           "MCP_MODE": "stdio"
         }
       }
     }
   }
   ```

6. **Restart Claude Desktop** and verify the n8n-manager appears in the MCP tools list

### 📁 Log Files
Logs are written to `~/.n8n-manager/logs/n8n-manager.log` to avoid interfering with MCP protocol communication.

## 💡 Usage Examples

### Creating a Simple Workflow
```
"Create a workflow named 'Test API' with a manual trigger"
```

### Listing Workflows
```
"Show me all active workflows"
"List workflows with tag 'production'"
```

### Checking Executions
```
"Show recent executions for workflow ID abc123"
"Get details of execution xyz789"
```

### Webhook Execution
```
"Trigger the webhook at https://n8n.example.com/webhook/abc-def-ghi"
```

## 📖 Documentation

- [CLAUDE.md](CLAUDE.md) - AI guidance, examples, and error solutions
- [Product Requirements Document](docs/PRD.md) - Original project specifications
- [Implementation Checklist](docs/implementation-checklist.md) - Development progress

## 🧪 Development

```bash
# Run tests
npm test

# Run in development mode
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 🔐 Security

- API keys are stored in environment variables
- No sensitive data is logged
- All communications use HTTPS
- Implements rate limiting and request validation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2024 Romuald Czlonkowski @ [aiadvisors.pl](https://aiadvisors.pl)

## 🙏 Acknowledgments

- [n8n](https://n8n.io) - The workflow automation platform
- [Anthropic](https://anthropic.com) - For Claude and the MCP protocol
- [Model Context Protocol](https://modelcontextprotocol.io) - The protocol enabling this integration

## 📞 Contact

**Romuald Czlonkowski**  
[aiadvisors.pl](https://aiadvisors.pl)

---

*Phase 1 Complete: Core workflow and execution management tools are fully functional. See [CLAUDE.md](CLAUDE.md) for detailed usage guidance and common error solutions.*