# Claude Desktop Setup Guide

## Configuration Added

The n8n Manager MCP server has been added to your Claude Desktop configuration.

### Server Name: `n8n-manager`

### Available Tools (12 total):

#### Workflow Management (7 tools)
- `n8n_create_workflow` - Create new workflow
- `n8n_get_workflow` - Get workflow by ID
- `n8n_update_workflow` - Update workflow
- `n8n_delete_workflow` - Delete workflow
- `n8n_list_workflows` - List workflows with filters
- `n8n_activate_workflow` - Activate workflow
- `n8n_deactivate_workflow` - Deactivate workflow

#### Execution Management (4 tools)
- `n8n_trigger_webhook_workflow` - Trigger workflow via webhook
- `n8n_get_execution` - Get execution details
- `n8n_list_executions` - List executions with filters
- `n8n_delete_execution` - Delete execution record

#### System Tools (1 tool)
- `n8n_health_check` - Check n8n instance health

## To Use the Server

1. **Restart Claude Desktop** to load the new configuration

2. **In a new Claude conversation**, you should see "n8n-manager" in the MCP connections

3. **Test the connection** by asking Claude to:
   - "Check the health of my n8n instance"
   - "List my n8n workflows"
   - "Show me recent workflow executions"

## Configuration Details

- **n8n Instance**: https://n8n.energyhouse.com.pl
- **API Key**: Configured (expires in 2025)
- **Log Level**: info
- **Server Location**: /Users/romualdczlonkowski/Pliki/n8n-manager-for-ai-agents

## Troubleshooting

If the server doesn't appear in Claude:

1. Make sure Claude Desktop is fully closed and restarted
2. Check that the build directory exists:
   ```bash
   ls -la /Users/romualdczlonkowski/Pliki/n8n-manager-for-ai-agents/build/
   ```

3. Test the server manually:
   ```bash
   cd /Users/romualdczlonkowski/Pliki/n8n-manager-for-ai-agents
   node build/index.js
   ```

4. Check Claude Desktop logs for errors

## Important Notes

- The server uses your n8n API key from the configuration
- Direct workflow execution is not available (use webhook triggers)
- All operations use cursor-based pagination
- The server logs are set to "info" level for debugging