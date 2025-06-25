import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { McpToolResponse } from '../types/index.js';
import { allTools } from './index.js';

// Tool definition
export const infoTool: Tool = {
  name: 'n8n_list_available_tools',
  description: `List all available n8n MCP tools with their descriptions and parameters.
Returns: Categorized list of tools with full descriptions, parameter details, and usage examples.
Use this to understand what operations are available through the n8n MCP server.`,
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

// Tool handler
export async function handleListAvailableTools(): Promise<McpToolResponse> {
  const toolsByCategory = {
    'Workflow Management': [
      'n8n_create_workflow',
      'n8n_get_workflow',
      'n8n_update_workflow',
      'n8n_delete_workflow',
      'n8n_list_workflows',
    ],
    'Execution Management': [
      'n8n_trigger_webhook_workflow',
      'n8n_get_execution',
      'n8n_list_executions',
      'n8n_delete_execution',
    ],
    'System Tools': [
      'n8n_health_check',
      'n8n_list_available_tools',
    ],
  };

  let text = '# Available n8n MCP Tools\n\n';

  for (const [category, toolNames] of Object.entries(toolsByCategory)) {
    text += `## ${category}\n\n`;

    for (const toolName of toolNames) {
      const tool = allTools.find(t => t.name === toolName);
      if (tool) {
        text += `### ${tool.name}\n`;
        text += `${tool.description}\n\n`;
        
        if (tool.inputSchema?.properties) {
          const props = tool.inputSchema.properties as Record<string, any>;
          const required = (tool.inputSchema as any).required || [];
          
          if (Object.keys(props).length > 0) {
            text += '**Parameters:**\n';
            for (const [key, value] of Object.entries(props)) {
              const isRequired = required.includes(key);
              const reqMark = isRequired ? ' (required)' : ' (optional)';
              text += `- \`${key}\`${reqMark}: ${value.description || value.type}\n`;
              if (value.default !== undefined) {
                text += `  - Default: ${JSON.stringify(value.default)}\n`;
              }
              if (value.enum) {
                text += `  - Options: ${value.enum.join(', ')}\n`;
              }
            }
            text += '\n';
          }
        }
      }
    }
  }

  text += '## Important Notes\n\n';
  text += '- Workflows are created **inactive** by default and must be activated manually in the n8n UI\n';
  text += '- The `tags` field is read-only and cannot be set via API\n';
  text += '- For webhook triggers, the HTTP method must match the webhook node configuration\n';
  text += '- Use cursor-based pagination for list operations - do not pass empty strings\n';

  return {
    content: [{
      type: 'text',
      text,
    }],
  };
}