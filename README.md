# n8n Manager for AI Agents

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.13.1-purple)](https://modelcontextprotocol.io)
[![n8n API](https://img.shields.io/badge/n8n%20API-v1-orange)](https://docs.n8n.io/api/)

A Model Context Protocol (MCP) server that enables Claude Desktop and other AI agents to manage n8n workflow automation instances through natural language interactions.

## 🎯 Project Overview

This project creates a seamless bridge between AI capabilities and n8n's workflow automation platform. It exposes n8n's public API operations as MCP tools, allowing AI agents to:

- ✅ Create, read, update, and delete workflows
- ✅ Manage workflow executions
- ✅ Handle credentials and tags
- ✅ Monitor instance health
- ⚡ Execute workflows via webhooks (API limitation workaround)

## 🚀 Key Features

- **Full n8n API Coverage**: Implements all available public API endpoints
- **Cursor-Based Pagination**: Efficient data retrieval for large datasets
- **Multi-Instance Support**: Manage multiple n8n instances from a single MCP server
- **Webhook Execution**: Innovative workaround for n8n's execution API limitations
- **Enterprise Feature Detection**: Automatically detects and handles enterprise-only features
- **Comprehensive Error Handling**: Graceful degradation for missing API endpoints
- **Security First**: API keys stored securely, no credentials in logs

## ⚠️ Known Limitations

Due to n8n public API constraints, the following features are handled with workarounds or documented as unavailable:

- **Direct Workflow Execution**: Use webhook triggers instead
- **Stop Execution**: Not available via API
- **User Management**: Enterprise UI only
- **Execution Date Filtering**: Client-side filtering implemented
- **Credential Schemas**: Not exposed via API

## 🛠️ Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.0
- **MCP SDK**: @modelcontextprotocol/sdk v1.13.1
- **HTTP Client**: Axios with connection pooling
- **Validation**: Zod schemas
- **Logging**: Winston
- **Testing**: Jest

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
   Add to your Claude Desktop configuration:
   ```json
   {
     "mcpServers": {
       "n8n": {
         "command": "node",
         "args": ["./n8n-manager-for-ai-agents/build/index.js"],
         "env": {
           "N8N_API_URL": "https://your-instance.com",
           "N8N_API_KEY": "your-api-key"
         }
       }
     }
   }
   ```

## 📖 Documentation

- [Product Requirements Document (PRD)](docs/PRD.md) - Comprehensive project specifications
- [Implementation Checklist](docs/implementation-checklist.md) - Development roadmap
- [API Review](docs/n8n-api-comprehensive-review.md) - n8n API analysis and findings

## 🧪 Development

```bash
# Run tests
npm test

# Run in development mode
npm run dev

# Type checking
npm run type-check

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

*This project is currently in active development. Check the [implementation checklist](docs/implementation-checklist.md) for progress updates.*