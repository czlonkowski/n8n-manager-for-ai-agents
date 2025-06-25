# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**n8n-manager-for-ai-agents** - An MCP server that enables Claude Desktop to manage n8n workflow automation instances through the n8n API.

### n8n Compatibility Requirements
- **Minimum n8n version**: 1.0.0
- **API version**: v1
- **Feature detection**: Runtime checks for enterprise features

### Key Features
- Complete n8n API coverage through MCP tools (within API constraints)
- Workflow creation, management, and webhook-based execution
- Credential management with secure handling
- Tag and variable management
- Audit and security reporting
- Multi-instance support

### Known n8n API Limitations
- **No direct workflow execution**: Must use webhook triggers
- **No execution control**: Cannot stop running executions
- **No user management**: Not exposed via public API
- **No credential schemas**: Cannot retrieve credential type definitions
- **Limited filtering**: Fewer options than expected
- **Cursor-based pagination**: Not offset-based as commonly expected

### Implemented Workarounds
1. **Webhook-Based Execution**: Workflows must have webhook triggers for execution
2. **Polling for Results**: Check execution status periodically
3. **Client-Side Filtering**: Additional filtering done in MCP server
4. **Feature Detection**: Runtime checks for available endpoints
5. **Variables via Source Control**: Using source control API for variable management

## Quick Reference: What Works vs What Doesn't

### ✅ Available via API
- Workflow CRUD operations
- Listing and getting executions (but NOT stopping them)
- Credential management (without schema info)
- Tags management
- Import/export workflows
- Source control operations
- Health checks

### ❌ NOT Available via API (Don't implement)
- Direct workflow execution (use webhooks instead)
- Stopping running executions
- User management (all CRUD operations)
- Credential type schemas
- Execution date filtering
- Community nodes management

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
- `n8n_trigger_webhook_workflow` - Trigger workflow via webhook (NOT direct execution)
- `n8n_get_execution` - Get execution details
- `n8n_list_executions` - List executions with filters (cursor-based)
- `n8n_delete_execution` - Delete execution record
- ~~`n8n_stop_execution`~~ - NOT AVAILABLE in public API

### Credential Management
- `n8n_create_credential` - Create credential
- `n8n_get_credential` - Get credential (no sensitive data)
- `n8n_update_credential` - Update credential
- `n8n_delete_credential` - Delete credential
- `n8n_list_credentials` - List credentials
- `n8n_get_credential_schema` - Get credential type schema

### User Management (NOT AVAILABLE)
**Note**: User management endpoints are not exposed through the n8n public API. These tools are specified for future implementation if/when n8n provides API access.
- ~~`n8n_list_users`~~ - Not available via API
- ~~`n8n_create_user`~~ - Not available via API
- ~~`n8n_get_user`~~ - Not available via API
- ~~`n8n_update_user`~~ - Not available via API
- ~~`n8n_delete_user`~~ - Not available via API

### Tags Management
- `n8n_create_tag` - Create new tag
- `n8n_update_tag` - Update existing tag
- `n8n_delete_tag` - Delete tag
- `n8n_list_tags` - List all tags (cursor-based)

### Variables Management
- `n8n_update_variables_via_source_control` - Update variables (no direct CRUD)

### Import/Export Tools
- `n8n_export_workflow` - Export workflow as JSON
- `n8n_import_workflow` - Import workflow from JSON
- `n8n_export_all_workflows` - Export all workflows

### Source Control Tools
- `n8n_pull_from_source_control` - Pull from git repository
- `n8n_push_to_source_control` - Push to git repository
- `n8n_get_source_control_status` - Get source control status

### Health and System Tools
- `n8n_health_check` - Check instance health and connectivity

### Audit Tools
- `n8n_generate_audit` - Generate security audit report

## Environment Configuration

### Single Instance Configuration
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

### Multi-Instance Configuration
```bash
# Define instance names
N8N_INSTANCES=production,staging,development

# Production instance
N8N_PRODUCTION_URL=https://prod.n8n.com
N8N_PRODUCTION_API_KEY=prod-api-key

# Staging instance
N8N_STAGING_URL=https://staging.n8n.com
N8N_STAGING_API_KEY=staging-api-key

# Development instance
N8N_DEVELOPMENT_URL=http://localhost:5678
N8N_DEVELOPMENT_API_KEY=dev-api-key

# Default instance (optional)
N8N_DEFAULT_INSTANCE=production
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

### Response Time Targets
- **List Operations**: < 500ms
- **Single Resource Fetch**: < 300ms
- **Workflow Execution**: < 1s to initiate
- **Batch Operations**: < 5s for 10 items

### Caching Strategy
```typescript
// Per-operation cache configuration
const cacheConfig = {
  // Cacheable operations with TTL
  'n8n_list_workflows': { ttl: 300, key: '{instance}:workflows:{hash}' },
  'n8n_get_workflow': { ttl: 300, key: '{instance}:workflow:{id}' },
  'n8n_list_credentials': { ttl: 600, key: '{instance}:credentials' },
  'n8n_list_tags': { ttl: 600, key: '{instance}:tags' },
  'n8n_health_check': { ttl: 60, key: '{instance}:health' },
  
  // Non-cacheable operations
  'n8n_list_executions': { ttl: 0 },
  'n8n_trigger_webhook_workflow': { ttl: 0 },
  'n8n_create_*': { ttl: 0 },
  'n8n_update_*': { ttl: 0 },
  'n8n_delete_*': { ttl: 0 }
};
```

### Rate Limiting Configuration
```typescript
const rateLimitConfig = {
  // Global rate limit
  global: {
    max: 60,        // requests
    window: 60000   // per minute
  },
  
  // Per-endpoint rate limits
  perEndpoint: {
    '/workflows': { max: 100, window: 60000 },
    '/workflows/:id': { max: 200, window: 60000 },
    '/executions': { max: 50, window: 60000 },
    '/webhooks': { max: 30, window: 60000 },
    '/credentials': { max: 50, window: 60000 }
  }
};
```

### Other Optimizations
1. **Connection Pooling**: Max 10 concurrent connections per instance
2. **Request Queuing**: Handle burst traffic gracefully
3. **Batch Operations**: Support for bulk operations where available
4. **Cache Invalidation**: Auto-invalidate on create/update/delete operations

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

## Implementation Phases

### Phase 1 - Core Functionality (Week 1)
- Update to MCP SDK v1.13.1
- Implement basic MCP server with stdio transport
- Create n8n API client with authentication
- Implement available workflow CRUD operations
- Add cursor-based pagination throughout
- Implement basic execution queries (list, get, delete)
- Add health check and metrics endpoints
- Document all API limitations clearly

### Phase 2 - Workarounds & Adaptations (Week 2)
- Implement webhook-based workflow execution system
- Add comprehensive error handling for missing endpoints
- Create feature detection for Enterprise endpoints
- Build fallback mechanisms for unavailable features
- Implement tag management tools
- Add caching layer with cursor support
- Multi-instance support

### Phase 3 - Advanced Features (Week 3)
- Variables management via source control API
- Client-side filtering for missing API filters
- Rate limiting implementation
- Batch operations for available endpoints
- Enhanced retry logic and error recovery
- Performance optimizations

### Phase 4 - Documentation & Polish (Week 4)
- Create migration guide from ideal to actual API
- Document all workarounds and limitations
- Full test coverage for implemented features
- Security hardening
- Docker deployment optimization
- Create examples for webhook-based execution
- User guide for handling API constraints

## Reference Implementation

The `docs/previous_app_with_MCP_example/` directory contains a complete MCP server implementation for n8n node documentation. While this project focuses on API integration rather than node documentation, the example demonstrates:
- MCP server setup patterns
- Tool registration and handling
- Error handling strategies
- Testing approaches
- Docker deployment

Study this example for MCP implementation patterns, but note that this project has different goals and scope.

## Success Criteria Checklist

### Launch Requirements
- [ ] All available n8n public API endpoints mapped to MCP tools
- [ ] Authentication working with API keys
- [ ] Error handling for all failure scenarios including missing endpoints
- [ ] Webhook-based workflow execution implemented
- [ ] Performance metrics meeting requirements
- [ ] Security audit passed
- [ ] Documentation complete with clear limitations
- [ ] Feature detection for Enterprise endpoints
- [ ] 95%+ test coverage for implemented features
- [ ] Multi-instance support working
- [ ] Caching and rate limiting implemented
- [ ] Docker deployment ready