import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { N8nApiClient } from '../services/n8nClient.js';
import { McpToolResponse, ExecutionStatus } from '../types/index.js';
import { log } from '../utils/logger.js';

// Zod schemas for validation
const getExecutionSchema = z.object({
  id: z.string(),
  includeData: z.boolean().default(false),
});

const listExecutionsSchema = z.object({
  limit: z.number().min(1).max(100).default(100),
  cursor: z.string().optional(),
  workflowId: z.string().optional(),
  projectId: z.string().optional(),
  status: z.nativeEnum(ExecutionStatus).optional(),
  includeData: z.boolean().default(false),
});

const deleteExecutionSchema = z.object({
  id: z.string(),
});

const webhookRequestSchema = z.object({
  webhookUrl: z.string().url(),
  httpMethod: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('POST'),
  data: z.record(z.unknown()).optional(),
  headers: z.record(z.string()).optional(),
  waitForResponse: z.boolean().default(true),
});

// Tool definitions
export const executionTools: Tool[] = [
  {
    name: 'n8n_trigger_webhook_workflow',
    description: 'Trigger a workflow via webhook (workflow must have webhook trigger node). Note: Direct workflow execution is not available via the n8n API.',
    inputSchema: {
      type: 'object',
      properties: {
        webhookUrl: { type: 'string', description: 'Full webhook URL from n8n workflow' },
        httpMethod: { 
          type: 'string', 
          enum: ['GET', 'POST', 'PUT', 'DELETE'], 
          default: 'POST',
          description: 'HTTP method to use',
        },
        data: { type: 'object', description: 'Data to send to webhook' },
        headers: { type: 'object', description: 'Additional HTTP headers' },
        waitForResponse: { 
          type: 'boolean', 
          description: 'Wait for webhook response', 
          default: true 
        },
      },
      required: ['webhookUrl'],
    },
  },
  {
    name: 'n8n_get_execution',
    description: 'Get details of a specific execution',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Execution ID' },
        includeData: { 
          type: 'boolean', 
          description: 'Include execution data', 
          default: false 
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'n8n_list_executions',
    description: 'List workflow executions with filters (uses cursor-based pagination). Note: Cannot filter by date or stop running executions.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 100, maximum: 100 },
        cursor: { type: 'string', description: 'Pagination cursor from previous response' },
        workflowId: { type: 'string', description: 'Filter by workflow ID' },
        projectId: { type: 'string', description: 'Filter by project (Enterprise only)' },
        status: { 
          enum: ['success', 'error', 'waiting'], 
          description: 'Filter by execution status (running status not available)' 
        },
        includeData: { 
          type: 'boolean', 
          description: 'Include full execution data', 
          default: false 
        },
      },
    },
  },
  {
    name: 'n8n_delete_execution',
    description: 'Delete an execution record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Execution ID to delete' },
      },
      required: ['id'],
    },
  },
];

// Tool handlers
export async function handleTriggerWebhookWorkflow(
  args: unknown,
  client: N8nApiClient
): Promise<McpToolResponse> {
  const params = webhookRequestSchema.parse(args);
  
  log.info('Triggering webhook workflow', { url: params.webhookUrl });
  
  try {
    const response = await client.triggerWebhookWorkflow(params);
    
    return {
      content: [{
        type: 'text',
        text: `Webhook triggered successfully!\nResponse: ${JSON.stringify(response, null, 2)}`,
      }],
    };
  } catch (error) {
    // Provide helpful error message for webhook issues
    if (error instanceof Error && error.message.includes('404')) {
      return {
        content: [{
          type: 'text',
          text: `Error: Webhook not found. Please ensure:
1. The workflow has a Webhook trigger node
2. The workflow is active
3. The webhook URL is correct
4. The HTTP method matches the webhook configuration`,
        }],
      };
    }
    throw error;
  }
}

export async function handleGetExecution(
  args: unknown,
  client: N8nApiClient
): Promise<McpToolResponse> {
  const params = getExecutionSchema.parse(args);
  
  const execution = await client.getExecution(params.id, params.includeData);
  
  let text = `Execution ID: ${execution.id}
Workflow: ${execution.workflowName || execution.workflowId}
Status: ${execution.status}
Mode: ${execution.mode}
Started: ${execution.startedAt}
Stopped: ${execution.stoppedAt || 'Still running'}
Finished: ${execution.finished ? 'Yes' : 'No'}`;

  if (execution.retryOf) {
    text += `\nRetry of: ${execution.retryOf}`;
  }

  if (execution.data && params.includeData) {
    text += `\n\nExecution Data:
${JSON.stringify(execution.data, null, 2)}`;
  }

  return {
    content: [{
      type: 'text',
      text,
    }],
  };
}

export async function handleListExecutions(
  args: unknown,
  client: N8nApiClient
): Promise<McpToolResponse> {
  const params = listExecutionsSchema.parse(args || {});
  
  const response = await client.listExecutions(params);
  
  let text = `Found ${response.data.length} executions`;
  
  if (response.nextCursor) {
    text += `\nMore results available. Next cursor: ${response.nextCursor}`;
  }
  
  text += '\n\nExecutions:';
  
  for (const execution of response.data) {
    text += `\n- ID: ${execution.id}`;
    text += ` | Workflow: ${execution.workflowName || execution.workflowId}`;
    text += ` | Status: ${execution.status}`;
    text += ` | Started: ${new Date(execution.startedAt).toLocaleString()}`;
    
    if (execution.stoppedAt) {
      const duration = new Date(execution.stoppedAt).getTime() - new Date(execution.startedAt).getTime();
      text += ` | Duration: ${(duration / 1000).toFixed(2)}s`;
    }
  }
  
  return {
    content: [{
      type: 'text',
      text,
    }],
  };
}

export async function handleDeleteExecution(
  args: unknown,
  client: N8nApiClient
): Promise<McpToolResponse> {
  const params = deleteExecutionSchema.parse(args);
  
  await client.deleteExecution(params.id);
  
  return {
    content: [{
      type: 'text',
      text: `Successfully deleted execution with ID: ${params.id}`,
    }],
  };
}