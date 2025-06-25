# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**n8n-manager-for-ai-agents** - An MCP server that enables Claude Desktop to manage n8n workflow automation instances through the n8n API.

### Key Features
- Complete n8n API coverage through MCP tools
- Workflow creation, management, and execution
- Credential management with secure handling
- User management (Enterprise features)
- Audit and security reporting

### Technology Stack
- **TypeScript**: Primary language
- **MCP SDK**: @modelcontextprotocol/sdk v1.13.1
- **HTTP Client**: Axios for n8n API communication
- **Validation**: Zod for schema validation
- **Logging**: Winston for structured logging
- **Testing**: Jest with TypeScript support

## Commands

### Initial Setup
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test
npm run test:integration

# Start MCP server
npm start
```

### Development
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Watch mode for development
npm run dev

# Run with debug logging
LOG_LEVEL=debug npm start

# Test with MCP Inspector
npx @modelcontextprotocol/inspector build/index.js
```

## Architecture

### System Design
```
Claude Desktop <-> MCP Protocol <-> n8n MCP Server <-> n8n API <-> n8n Instance
```

### Core Components

1. **MCP Server** (`src/server.ts`)
   - Implements MCP protocol using @modelcontextprotocol/sdk v1.13.1
   - Registers all n8n API operations as tools
   - Handles stdio transport for Claude Desktop

2. **n8n API Client** (`src/services/n8nClient.ts`)
   - Axios-based HTTP client
   - API key authentication (X-N8N-API-KEY header)
   - Connection pooling and retry logic

3. **Tool Implementations** (`src/tools/`)
   - `workflows.ts` - Workflow CRUD operations
   - `executions.ts` - Execution management
   - `credentials.ts` - Credential handling
   - `users.ts` - User management (Enterprise)
   - `audit.ts` - Security audit tools

4. **Services** (`src/services/`)
   - Input validation with Zod schemas
   - Error handling and retry logic
   - Caching for performance

### Project Structure
```
src/
├── index.ts              # Entry point
├── server.ts             # MCP server class
├── config/
│   └── environment.ts    # Environment config
├── tools/
│   ├── workflows.ts      # Workflow tools
│   ├── executions.ts     # Execution tools
│   ├── credentials.ts    # Credential tools
│   ├── users.ts          # User tools
│   └── audit.ts          # Audit tools
├── services/
│   ├── n8nClient.ts      # n8n API client
│   ├── validation.ts     # Input validation
│   └── cache.ts          # Caching service
├── utils/
│   ├── logger.ts         # Winston logger
│   └── errors.ts         # Error handling
└── types/
    └── index.ts          # TypeScript types
```

## MCP Tools Reference

### Workflow Management
- `n8n_create_workflow` - Create new workflow
- `n8n_get_workflow` - Get workflow by ID
- `n8n_update_workflow` - Update workflow
- `n8n_delete_workflow` - Delete workflow
- `n8n_list_workflows` - List workflows with filters
- `n8n_activate_workflow` - Activate workflow
- `n8n_deactivate_workflow` - Deactivate workflow

### Execution Management
- `n8n_execute_workflow` - Execute workflow with data
- `n8n_get_execution` - Get execution details
- `n8n_list_executions` - List executions with filters
- `n8n_stop_execution` - Stop running execution
- `n8n_delete_execution` - Delete execution record

### Credential Management
- `n8n_create_credential` - Create credential
- `n8n_get_credential` - Get credential (no sensitive data)
- `n8n_update_credential` - Update credential
- `n8n_delete_credential` - Delete credential
- `n8n_list_credentials` - List credentials
- `n8n_get_credential_schema` - Get credential type schema

### User Management (Enterprise)
- `n8n_list_users` - List all users
- `n8n_create_user` - Create new user
- `n8n_get_user` - Get user details
- `n8n_update_user` - Update user info
- `n8n_delete_user` - Delete user

### Audit Tools
- `n8n_generate_audit` - Generate security audit report

## Environment Configuration

Required environment variables:
```bash
# n8n API Configuration
N8N_API_URL=https://your-n8n-instance.com
N8N_API_KEY=your-api-key-here

# Server Configuration
LOG_LEVEL=info                  # debug, info, warn, error
RATE_LIMIT_MAX=60              # Max requests per window
RATE_LIMIT_WINDOW=60000        # Rate limit window (ms)
CACHE_TTL=300                  # Cache TTL in seconds

# Optional
NODE_ENV=development           # development, production
```

## Security Considerations

1. **API Key Storage**: Never commit API keys. Use environment variables
2. **Credential Handling**: Never log credential data
3. **Error Messages**: Sanitize error messages to avoid leaking sensitive info
4. **Session Isolation**: Each Claude session should have isolated credentials
5. **Audit Logging**: Log all API operations for security monitoring

## Testing Guidelines

### Unit Tests
```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # Coverage report
```

### Integration Tests
```bash
npm run test:integration   # Test against real n8n instance
```

### Manual Testing with MCP Inspector
```bash
npx @modelcontextprotocol/inspector build/index.js
```

## Performance Optimization

1. **Caching**: 5-minute TTL for frequently accessed data
2. **Connection Pooling**: Max 10 concurrent connections
3. **Batch Operations**: Support for bulk operations where possible
4. **Response Time Targets**:
   - List operations: < 500ms
   - Single resource: < 300ms
   - Workflow execution: < 1s to initiate

## Error Handling

Standard error response format:
```typescript
{
  isError: true,
  content: [{
    type: "text",
    text: "Error: [Human-readable message with guidance]"
  }]
}
```

Common error scenarios:
- 401: Authentication failed - check API key
- 403: Insufficient permissions
- 404: Resource not found
- 429: Rate limit exceeded - implement retry
- 500: Server error - graceful degradation

## Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
USER node
EXPOSE 3000
HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1
CMD ["node", "build/index.js"]
```

## Claude Desktop Integration

Add to Claude Desktop config:
```json
{
  "mcpServers": {
    "n8n": {
      "command": "node",
      "args": ["/absolute/path/to/build/index.js"],
      "env": {
        "N8N_API_URL": "https://your-instance.com",
        "N8N_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Reference Implementation

The `docs/previous_app_with_MCP_example/` directory contains a complete MCP server implementation for n8n node documentation. While this project focuses on API integration rather than node documentation, the example demonstrates:
- MCP server setup patterns
- Tool registration and handling
- Error handling strategies
- Testing approaches
- Docker deployment

Study this example for MCP implementation patterns, but note that this project has different goals and scope.