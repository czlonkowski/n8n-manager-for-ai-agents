# n8n MCP Server Product Requirements Document

## Executive Summary

This PRD defines the requirements for developing a Model Context Protocol (MCP) server that enables Claude Desktop to manage self-hosted n8n workflow automation instances. The integration provides access to available n8n public API operations through standardized MCP tools, enabling AI-assisted workflow creation, management, and monitoring within the constraints of the n8n API.

## Project Overview

### Vision
Create a seamless bridge between Claude's AI capabilities and n8n's workflow automation platform, empowering users to build, manage, and execute complex automation workflows through natural language interactions.

### Objectives
- **Available API Coverage**: Expose all available n8n public API operations as MCP tools
- **Realistic Workflow Management**: Work within n8n API constraints for workflow execution
- **Security-First Design**: Implement robust authentication and secure credential management
- **Performance Optimization**: Enable efficient operations with cursor-based pagination and caching
- **Developer Experience**: Provide clear documentation about capabilities and limitations

### Success Metrics
- Full coverage of all available n8n public API endpoints
- Graceful handling of API limitations
- Sub-second response times for common operations
- Zero security vulnerabilities in credential handling
- 95%+ test coverage for implemented MCP tools
- Clear documentation of unsupported features

### n8n Compatibility Requirements
- **Minimum n8n version**: 1.0.0
- **API version**: v1
- **Feature detection**: Runtime checks for enterprise features

## Technical Architecture

### System Overview
```
Claude Desktop <-> MCP Protocol <-> n8n MCP Server <-> n8n API <-> n8n Instance
```

### Core Components

#### 1. MCP Server Core
- **Protocol**: JSON-RPC 2.0 over stdio transport
- **Framework**: Node.js with TypeScript
- **SDK**: @modelcontextprotocol/sdk v1.13.1
- **Architecture Pattern**: Modular service-based design

#### 2. n8n API Client Layer
- **HTTP Client**: Axios with connection pooling
- **Authentication**: API key via X-N8N-API-KEY header
- **Base URL Pattern**: `https://instance.domain/api/v1`
- **Timeout**: 30 seconds default, configurable

#### 3. Tool Registry System
- **Dynamic Tool Discovery**: Auto-register all API operations
- **Schema Validation**: Zod-based input validation
- **Error Handling**: Graceful degradation with detailed error messages

### Authentication Architecture
- **Primary Method**: API key authentication
- **Storage**: Environment variables with encryption
- **Session Management**: Credential isolation per Claude session
- **Security**: No API keys stored in logs or error messages
- **Multi-Instance Support**: Configure multiple n8n instances with separate credentials

## Data Structures

### Workflow Node Schema
```typescript
interface WorkflowNode {
  id: string;                          // Unique node identifier
  name: string;                        // Display name
  type: string;                        // Node type (e.g., "n8n-nodes-base.httpRequest")
  typeVersion: number;                 // Version of the node type
  position: [number, number];          // X, Y coordinates in editor
  parameters: Record<string, any>;     // Node-specific parameters
  credentials?: Record<string, string>; // Credential IDs by type
  disabled?: boolean;                  // Whether node is disabled
  notes?: string;                      // User notes
  notesInFlow?: boolean;               // Show notes in workflow
  continueOnFail?: boolean;            // Continue on error
  retryOnFail?: boolean;               // Retry on failure
  maxTries?: number;                   // Max retry attempts
  waitBetweenTries?: number;           // Ms between retries
  alwaysOutputData?: boolean;          // Always output data
  executeOnce?: boolean;               // Execute only once
}
```

### Workflow Connection Schema
```typescript
interface WorkflowConnection {
  [sourceNodeId: string]: {
    main: Array<Array<{
      node: string;      // Target node ID
      type: string;      // Connection type (usually "main")
      index: number;     // Output index (usually 0)
    }>>;
  };
}
```

### Workflow Schema
```typescript
interface Workflow {
  id?: string;                         // Workflow ID (generated if not provided)
  name: string;                        // Workflow name
  nodes: WorkflowNode[];               // Array of nodes
  connections: WorkflowConnection;     // Node connections
  active: boolean;                     // Whether workflow is active
  settings?: {
    executionOrder?: "v0" | "v1";      // Execution order version
    timezone?: string;                 // Timezone for cron triggers
    saveDataErrorExecution?: "all" | "none"; // Error data saving
    saveDataSuccessExecution?: "all" | "none"; // Success data saving
    saveManualExecutions?: boolean;    // Save manual executions
    saveExecutionProgress?: boolean;   // Save execution progress
    executionTimeout?: number;         // Timeout in seconds
    errorWorkflow?: string;            // Error workflow ID
  };
  staticData?: Record<string, any>;    // Static workflow data
  tags?: string[];                     // Tag IDs
  updatedAt?: string;                  // ISO date string
  createdAt?: string;                  // ISO date string
}
```

## Known n8n API Limitations

### Not Available in Public API
The following features are not exposed through the n8n public API and cannot be implemented:

1. **Direct Workflow Execution**: No API endpoint for directly executing workflows
   - **Workaround**: Use webhook triggers for workflow execution
2. **Execution Control**: Cannot stop running executions via API
3. **User Management**: No public API endpoints for user CRUD operations
4. **Credential Schemas**: Cannot retrieve credential type schemas
5. **Execution Date Filtering**: Cannot filter executions by date range
6. **Running Status**: API doesn't return "running" status for executions

### API Differences from Documentation
1. **Pagination**: n8n uses cursor-based pagination, not offset-based
2. **Limited Filtering**: Fewer filter options than expected for list operations
3. **Enterprise Features**: Many features require Enterprise edition but aren't accessible via API

### Workarounds Implemented
1. **Webhook-Based Execution**: Workflows must have webhook triggers for execution
2. **Polling for Results**: Check execution status periodically
3. **Client-Side Filtering**: Additional filtering done in MCP server
4. **Feature Detection**: Runtime checks for available endpoints

## Complete MCP Tool Specifications

### Workflow Management Tools

#### n8n_create_workflow
```typescript
{
  name: "n8n_create_workflow",
  description: "Create a new n8n workflow with nodes and connections",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Workflow name" },
      nodes: { type: "array", description: "Array of workflow nodes" },
      connections: { type: "object", description: "Node connection mappings" },
      active: { type: "boolean", description: "Activate on creation", default: false },
      tags: { type: "array", items: { type: "string" } }
    },
    required: ["name", "nodes", "connections"]
  }
}
```

#### n8n_get_workflow
```typescript
{
  name: "n8n_get_workflow",
  description: "Retrieve a specific workflow by ID",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "Workflow ID" }
    },
    required: ["id"]
  }
}
```

#### n8n_update_workflow
```typescript
{
  name: "n8n_update_workflow",
  description: "Update an existing workflow",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "Workflow ID" },
      name: { type: "string", description: "Updated workflow name" },
      nodes: { type: "array", description: "Updated nodes configuration" },
      connections: { type: "object", description: "Updated connections" },
      active: { type: "boolean", description: "Activation status" }
    },
    required: ["id"]
  }
}
```

#### n8n_delete_workflow
```typescript
{
  name: "n8n_delete_workflow",
  description: "Delete a workflow permanently",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "Workflow ID to delete" }
    },
    required: ["id"]
  }
}
```

#### n8n_list_workflows
```typescript
{
  name: "n8n_list_workflows",
  description: "List all workflows with filtering options (uses cursor-based pagination)",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "number", description: "Number of results", default: 100, maximum: 100 },
      cursor: { type: "string", description: "Pagination cursor from previous response" },
      active: { type: "boolean", description: "Filter by active status" },
      tags: { type: "array", items: { type: "string" }, description: "Filter by tags" },
      projectId: { type: "string", description: "Filter by project (Enterprise only)" },
      excludePinnedData: { type: "boolean", description: "Exclude pinned node data", default: true },
      instance: { type: "string", description: "n8n instance to query (for multi-instance setups)" }
    }
  }
}
```

#### n8n_activate_workflow
```typescript
{
  name: "n8n_activate_workflow",
  description: "Activate a workflow to enable triggers",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "Workflow ID" }
    },
    required: ["id"]
  }
}
```

#### n8n_deactivate_workflow
```typescript
{
  name: "n8n_deactivate_workflow",
  description: "Deactivate a workflow to disable triggers",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "Workflow ID" }
    },
    required: ["id"]
  }
}
```

### Execution Management Tools

#### n8n_trigger_webhook_workflow
```typescript
{
  name: "n8n_trigger_webhook_workflow",
  description: "Trigger a workflow via webhook (workflow must have webhook trigger node)",
  inputSchema: {
    type: "object",
    properties: {
      webhookUrl: { type: "string", description: "Full webhook URL from n8n workflow" },
      httpMethod: { type: "string", enum: ["GET", "POST", "PUT", "DELETE"], default: "POST" },
      data: { type: "object", description: "Data to send to webhook" },
      headers: { type: "object", description: "Additional HTTP headers" },
      waitForResponse: { type: "boolean", description: "Wait for webhook response", default: true }
    },
    required: ["webhookUrl"]
  }
}
```

**Note**: Direct workflow execution is not available via the n8n API. Workflows must be triggered through webhooks or other trigger nodes.

#### n8n_get_execution
```typescript
{
  name: "n8n_get_execution",
  description: "Get details of a specific execution",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "Execution ID" },
      includeData: { type: "boolean", description: "Include execution data", default: false }
    },
    required: ["id"]
  }
}
```

#### n8n_list_executions
```typescript
{
  name: "n8n_list_executions",
  description: "List workflow executions with filters (uses cursor-based pagination)",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "number", default: 100, maximum: 100 },
      cursor: { type: "string", description: "Pagination cursor from previous response" },
      workflowId: { type: "string", description: "Filter by workflow ID" },
      projectId: { type: "string", description: "Filter by project (Enterprise only)" },
      status: { enum: ["success", "error", "waiting"], description: "Filter by execution status" },
      includeData: { type: "boolean", description: "Include full execution data", default: false }
    }
  }
}
```

#### n8n_delete_execution
```typescript
{
  name: "n8n_delete_execution",
  description: "Delete an execution record",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "Execution ID to delete" }
    },
    required: ["id"]
  }
}
```

### Credential Management Tools

#### n8n_create_credential
```typescript
{
  name: "n8n_create_credential",
  description: "Create a new credential entry",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Credential name" },
      type: { type: "string", description: "Credential type (e.g., 'httpBasicAuth')" },
      data: { type: "object", description: "Credential data (encrypted)" },
      nodesAccess: { type: "array", items: { type: "string" } }
    },
    required: ["name", "type", "data"]
  }
}
```

#### n8n_get_credential
```typescript
{
  name: "n8n_get_credential",
  description: "Get credential details (without sensitive data)",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "Credential ID" }
    },
    required: ["id"]
  }
}
```

#### n8n_update_credential
```typescript
{
  name: "n8n_update_credential",
  description: "Update an existing credential",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "Credential ID" },
      name: { type: "string" },
      data: { type: "object" },
      nodesAccess: { type: "array", items: { type: "string" } }
    },
    required: ["id"]
  }
}
```

#### n8n_delete_credential
```typescript
{
  name: "n8n_delete_credential",
  description: "Delete a credential",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "Credential ID to delete" }
    },
    required: ["id"]
  }
}
```

#### n8n_list_credentials
```typescript
{
  name: "n8n_list_credentials",
  description: "List all credentials (uses cursor-based pagination)",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "number", default: 100, maximum: 100 },
      cursor: { type: "string", description: "Pagination cursor from previous response" },
      type: { type: "string", description: "Filter by credential type" }
    }
  }
}
```

### Tags Management Tools

#### n8n_create_tag
```typescript
{
  name: "n8n_create_tag",
  description: "Create a new tag",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Tag name" }
    },
    required: ["name"]
  }
}
```

#### n8n_update_tag
```typescript
{
  name: "n8n_update_tag",
  description: "Update an existing tag",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "Tag ID" },
      name: { type: "string", description: "New tag name" }
    },
    required: ["id", "name"]
  }
}
```

#### n8n_delete_tag
```typescript
{
  name: "n8n_delete_tag",
  description: "Delete a tag",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "Tag ID to delete" }
    },
    required: ["id"]
  }
}
```

#### n8n_list_tags
```typescript
{
  name: "n8n_list_tags",
  description: "List all tags (uses cursor-based pagination)",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "number", default: 100, maximum: 100 },
      cursor: { type: "string", description: "Pagination cursor from previous response" }
    }
  }
}
```

### Variables Management Tools

**Note**: Variables are managed through the source control API endpoint. Direct CRUD operations may not be available.

#### n8n_update_variables_via_source_control
```typescript
{
  name: "n8n_update_variables_via_source_control",
  description: "Update variables by pulling from source control (creates new or updates existing)",
  inputSchema: {
    type: "object",
    properties: {
      variables: { 
        type: "array", 
        description: "Array of variables to update",
        items: {
          type: "object",
          properties: {
            key: { type: "string", description: "Variable key" },
            value: { type: "string", description: "Variable value" }
          },
          required: ["key", "value"]
        }
      }
    },
    required: ["variables"]
  }
}
```

### Workflow Import/Export Tools

#### n8n_export_workflow
```typescript
{
  name: "n8n_export_workflow",
  description: "Export a workflow as JSON",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "Workflow ID to export" },
      includeCredentials: { type: "boolean", default: false }
    },
    required: ["id"]
  }
}
```

#### n8n_import_workflow
```typescript
{
  name: "n8n_import_workflow",
  description: "Import a workflow from JSON",
  inputSchema: {
    type: "object",
    properties: {
      workflowData: { type: "object", description: "Workflow JSON data" },
      activate: { type: "boolean", default: false }
    },
    required: ["workflowData"]
  }
}
```

#### n8n_export_all_workflows
```typescript
{
  name: "n8n_export_all_workflows",
  description: "Export all workflows as a collection",
  inputSchema: {
    type: "object",
    properties: {
      includeCredentials: { type: "boolean", default: false },
      includeInactive: { type: "boolean", default: true }
    }
  }
}
```

### Source Control Tools

#### n8n_pull_from_source_control
```typescript
{
  name: "n8n_pull_from_source_control",
  description: "Pull workflows from configured git repository",
  inputSchema: {
    type: "object",
    properties: {
      force: { type: "boolean", default: false, description: "Force pull, overwriting local changes" }
    }
  }
}
```

#### n8n_push_to_source_control
```typescript
{
  name: "n8n_push_to_source_control",
  description: "Push workflows to configured git repository",
  inputSchema: {
    type: "object",
    properties: {
      message: { type: "string", description: "Commit message" },
      workflowIds: { type: "array", items: { type: "string" }, description: "Specific workflows to push" }
    },
    required: ["message"]
  }
}
```

#### n8n_get_source_control_status
```typescript
{
  name: "n8n_get_source_control_status",
  description: "Get current source control status",
  inputSchema: {
    type: "object",
    properties: {}
  }
}
```

### Community Nodes Tools

**Note**: Community nodes management endpoints are not documented in the public API and may not be available.

#### n8n_list_community_nodes
```typescript
{
  name: "n8n_list_community_nodes",
  description: "List available community nodes",
  inputSchema: {
    type: "object",
    properties: {
      search: { type: "string", description: "Search term" },
      limit: { type: "number", default: 20 }
    }
  }
}
```

#### n8n_install_community_node
```typescript
{
  name: "n8n_install_community_node",
  description: "Install a community node package",
  inputSchema: {
    type: "object",
    properties: {
      packageName: { type: "string", description: "NPM package name" }
    },
    required: ["packageName"]
  }
}
```

#### n8n_uninstall_community_node
```typescript
{
  name: "n8n_uninstall_community_node",
  description: "Uninstall a community node package",
  inputSchema: {
    type: "object",
    properties: {
      packageName: { type: "string", description: "NPM package name to uninstall" }
    },
    required: ["packageName"]
  }
}
```

### Health and System Tools

#### n8n_health_check
```typescript
{
  name: "n8n_health_check",
  description: "Check n8n instance health and API connectivity",
  inputSchema: {
    type: "object",
    properties: {
      instance: { type: "string", description: "Instance name (for multi-instance setups)" }
    }
  }
}
```

### Audit and Analysis Tools

#### n8n_generate_audit
```typescript
{
  name: "n8n_generate_audit",
  description: "Generate security and risk audit report",
  inputSchema: {
    type: "object",
    properties: {
      categories: { 
        type: "array", 
        items: { enum: ["workflow", "credential", "user"] },
        default: ["workflow", "credential", "user"]
      },
      daysAbandonedWorkflow: { type: "number", default: 90 }
    }
  }
}
```

### User Management Tools (NOT AVAILABLE IN PUBLIC API)

**Important**: User management endpoints are not exposed through the n8n public API. These tools are specified for future implementation if/when n8n provides API access. Currently, user management must be done through the n8n UI.

#### n8n_list_users
```typescript
{
  name: "n8n_list_users",
  description: "List all users (Enterprise only)",
  inputSchema: {
    type: "object",
    properties: {
      limit: { type: "number", default: 10 },
      cursor: { type: "string" }
    }
  }
}
```

#### n8n_create_user
```typescript
{
  name: "n8n_create_user",
  description: "Create a new user (Enterprise only)",
  inputSchema: {
    type: "object",
    properties: {
      email: { type: "string", format: "email" },
      firstName: { type: "string" },
      lastName: { type: "string" },
      role: { type: "string" }
    },
    required: ["email", "firstName", "lastName"]
  }
}
```

#### n8n_get_user
```typescript
{
  name: "n8n_get_user",
  description: "Get user details (Enterprise only)",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "User ID" }
    },
    required: ["id"]
  }
}
```

#### n8n_update_user
```typescript
{
  name: "n8n_update_user",
  description: "Update user information (Enterprise only)",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string" },
      firstName: { type: "string" },
      lastName: { type: "string" },
      role: { type: "string" }
    },
    required: ["id"]
  }
}
```

#### n8n_delete_user
```typescript
{
  name: "n8n_delete_user",
  description: "Delete a user (Enterprise only)",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string", description: "User ID to delete" }
    },
    required: ["id"]
  }
}
```

## Security Requirements

### Authentication
- **API Key Management**: Secure storage in environment variables
- **Key Rotation**: Support for periodic API key rotation
- **Session Isolation**: Each Claude session uses isolated credentials

### Data Protection
- **Encryption at Rest**: All sensitive data encrypted in storage
- **Encryption in Transit**: HTTPS-only communication
- **Credential Handling**: Never log or expose sensitive credential data

### Access Control
- **Scope Validation**: Respect API key permissions and scopes
- **Rate Limiting**: Implement client-side rate limiting
- **Audit Logging**: Log all API operations for security monitoring

## Error Handling Strategy

### Error Categories
1. **Authentication Errors (401)**: Clear message about API key issues
2. **Authorization Errors (403)**: Explain permission requirements
3. **Not Found Errors (404)**: Suggest valid resource IDs
4. **Rate Limit Errors (429)**: Implement exponential backoff
5. **Server Errors (500)**: Graceful degradation with cached data

### Error Response Format

MCP standard error format:
```typescript
{
  error: {
    code: string;    // Standard error codes
    message: string; // Human-readable error message
    data?: any;      // Additional error context
  }
}
```

Standard error codes:
- `INVALID_PARAMS`: Invalid input parameters
- `INTERNAL_ERROR`: Server-side error
- `AUTHENTICATION_ERROR`: API key issues
- `AUTHORIZATION_ERROR`: Permission denied
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_ERROR`: Too many requests
- `NETWORK_ERROR`: Connection issues

## Performance Requirements

### Response Times
- **List Operations**: < 500ms
- **Single Resource Fetch**: < 300ms
- **Workflow Execution**: < 1s to initiate
- **Batch Operations**: < 5s for 10 items

### Caching Strategy

#### Per-Operation Configuration
```typescript
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

#### Cache Invalidation Rules
- On create: Invalidate list caches
- On update: Invalidate specific item and list caches
- On delete: Invalidate specific item and list caches
- Manual invalidation via environment variable

### Scalability
- **Connection Pooling**: Max 10 concurrent connections per instance
- **Request Queuing**: Handle burst traffic gracefully
- **Resource Limits**: Configurable memory and CPU limits

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
  },
  
  // Per-instance rate limits (for multi-instance)
  perInstance: {
    'production': { max: 100, window: 60000 },
    'staging': { max: 50, window: 60000 },
    'development': { max: 200, window: 60000 }
  }
};
```

## Testing Requirements

### Test Coverage
- **Unit Tests**: 95% code coverage minimum
- **Integration Tests**: All API endpoints tested
- **E2E Tests**: Complete user workflows validated

### Test Scenarios
1. **Authentication Flow**: Valid/invalid API keys
2. **CRUD Operations**: All resource types
3. **Error Handling**: Each error category
4. **Performance**: Load testing with 100 concurrent operations
5. **Security**: Penetration testing for credential leaks

### Testing Tools
- **Unit Testing**: Jest with TypeScript support
- **Integration Testing**: MCP Inspector
- **E2E Testing**: Claude Desktop manual testing
- **Performance Testing**: Artillery or K6

## Deployment Configuration

### Environment Variables

#### Single Instance Configuration
```bash
N8N_API_URL=https://your-n8n-instance.com
N8N_API_KEY=your-api-key-here
LOG_LEVEL=info
RATE_LIMIT_MAX=60
RATE_LIMIT_WINDOW=60000
CACHE_TTL=300
```

#### Multi-Instance Configuration
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

### Docker Support
- **Base Image**: node:20-alpine
- **Multi-stage Build**: Optimize image size
- **Health Checks**: Endpoint for monitoring
- **Security**: Non-root user execution

### Claude Desktop Integration
```json
{
  "mcpServers": {
    "n8n": {
      "command": "node",
      "args": ["/path/to/n8n-manager-for-ai-agents/build/index.js"],
      "env": {
        "N8N_API_URL": "https://your-instance.com",
        "N8N_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Documentation Requirements

### User Documentation
- **Setup Guide**: Step-by-step installation
- **Configuration Reference**: All environment variables
- **Tool Catalog**: Description of each MCP tool
- **Example Workflows**: Common automation patterns

### Developer Documentation
- **API Reference**: Generated from TypeScript types
- **Architecture Guide**: System design decisions
- **Contributing Guide**: Development workflow
- **Security Guide**: Best practices for deployment

## Success Criteria

### Launch Criteria
- [ ] All available n8n public API endpoints mapped to MCP tools
- [ ] Authentication working with API keys
- [ ] Error handling for all failure scenarios including missing endpoints
- [ ] Webhook-based workflow execution implemented
- [ ] Performance metrics meeting requirements
- [ ] Security audit passed
- [ ] Documentation complete with clear limitations
- [ ] Feature detection for Enterprise endpoints

### Post-Launch Metrics
- **Adoption**: Number of Claude Desktop users
- **Reliability**: 99.9% uptime target
- **Performance**: P95 latency < 1 second
- **Security**: Zero credential leaks
- **User Satisfaction**: > 4.5/5 rating

---

# API Implementation Guide for Claude Code

## Quick Start

### Prerequisites
- Node.js 20+ installed
- n8n instance with API access enabled
- n8n API key generated

### Installation Steps

1. **Clone and Setup**
```bash
git clone https://github.com/czlonkowski/n8n-manager-for-ai-agents
cd n8n-manager-for-ai-agents
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your n8n instance details
```

3. **Build and Test**
```bash
npm run build
npm test
npm run test:integration
```

4. **Configure Claude Desktop**
Add to Claude Desktop config:
```json
{
  "mcpServers": {
    "n8n": {
      "command": "node",
      "args": ["./n8n-manager-for-ai-agents/build/index.js"]
    }
  }
}
```

## Project Structure

```
n8n-manager-for-ai-agents/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # MCP server setup
│   ├── tools/
│   │   ├── workflows.ts      # Workflow management tools
│   │   ├── executions.ts     # Execution tools
│   │   └── credentials.ts    # Credential tools
│   ├── services/
│   │   ├── n8nClient.ts      # n8n API client
│   │   └── validation.ts     # Input validation
│   └── utils/
│       ├── logger.ts         # Logging utility
│       └── errors.ts         # Error handling
├── tests/
├── docs/
└── package.json
```

## Core Implementation

### Main Server Entry Point
```typescript
// src/index.ts
import { N8nMcpServer } from './server.js';
import { config } from './config/environment.js';

const server = new N8nMcpServer(config);
server.start().catch(console.error);
```

### MCP Server Class
```typescript
// src/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export class N8nMcpServer {
  private server: Server;
  
  constructor(config: Config) {
    this.server = new Server(
      { name: 'n8n-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    this.setupHandlers();
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
```

### Tool Implementation Example
```typescript
// src/tools/workflows.ts
export function createWorkflowTool() {
  return {
    name: 'n8n_create_workflow',
    description: 'Create a new workflow',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        nodes: { type: 'array' },
        connections: { type: 'object' }
      },
      required: ['name', 'nodes', 'connections']
    }
  };
}

export async function handleCreateWorkflow(args: any, client: N8nClient) {
  const workflow = await client.createWorkflow(args);
  return {
    content: [{
      type: 'text',
      text: `Created workflow "${workflow.name}" with ID: ${workflow.id}`
    }]
  };
}
```

### n8n API Client
```typescript
// src/services/n8nClient.ts
import axios from 'axios';

export class N8nClient {
  private client: AxiosInstance;

  constructor(config: { baseUrl: string; apiKey: string }) {
    this.client = axios.create({
      baseURL: `${config.baseUrl}/api/v1`,
      headers: { 'X-N8N-API-KEY': config.apiKey }
    });
  }

  async createWorkflow(data: any) {
    const response = await this.client.post('/workflows', data);
    return response.data;
  }
}
```

## Error Handling Best Practices

```typescript
// src/utils/errors.ts
export async function withErrorHandling<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Check your API key.');
    }
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please retry later.');
    }
    throw error;
  }
}
```

## Testing Strategy

### Unit Test Example
```typescript
// tests/unit/workflows.test.ts
describe('Workflow Tools', () => {
  it('should create workflow successfully', async () => {
    const mockClient = { createWorkflow: jest.fn() };
    mockClient.createWorkflow.mockResolvedValue({
      id: '123',
      name: 'Test Workflow'
    });

    const result = await handleCreateWorkflow(
      { name: 'Test', nodes: [], connections: {} },
      mockClient
    );

    expect(result.content[0].text).toContain('123');
  });
});
```

### Integration Test Example
```typescript
// tests/integration/server.test.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

describe('n8n MCP Server', () => {
  let client: Client;

  beforeAll(async () => {
    // Setup test client
  });

  it('should list available tools', async () => {
    const tools = await client.listTools();
    expect(tools).toContain('n8n_create_workflow');
  });
});
```

## Deployment

### Docker Deployment
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
USER node
CMD ["node", "build/index.js"]
```

### Production Configuration
```bash
# Production environment variables
N8N_API_URL=https://n8n.company.com
N8N_API_KEY=${SECURE_API_KEY}
LOG_LEVEL=info
NODE_ENV=production
```

## Monitoring and Debugging

### Logging Configuration
```typescript
// src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm start

# Use MCP Inspector
npx @modelcontextprotocol/inspector build/index.js
```

## Common Issues and Solutions

### Issue: Authentication Errors
**Solution**: Verify API key is correct and has required permissions
```bash
curl -H "X-N8N-API-KEY: your-key" https://your-instance/api/v1/workflows
```

### Issue: Connection Timeouts
**Solution**: Increase timeout in client configuration
```typescript
this.client = axios.create({
  timeout: 60000 // 60 seconds
});
```

### Issue: Rate Limiting
**Solution**: Implement exponential backoff
```typescript
async function retryWithBackoff(fn: Function, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
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

## Performance Optimization

### Caching Implementation
```typescript
const cache = new Map();

export async function getCachedWorkflow(id: string) {
  if (cache.has(id)) {
    return cache.get(id);
  }
  const workflow = await client.getWorkflow(id);
  cache.set(id, workflow);
  setTimeout(() => cache.delete(id), 300000); // 5 min TTL
  return workflow;
}
```

### Batch Operations
```typescript
export async function batchExecuteWorkflows(workflowIds: string[]) {
  const results = await Promise.allSettled(
    workflowIds.map(id => client.executeWorkflow(id))
  );
  return results.map((result, index) => ({
    workflowId: workflowIds[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : result.reason
  }));
}
```
