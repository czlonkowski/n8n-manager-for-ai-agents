import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { N8nApiClient } from '../services/n8nClient.js';
import { McpToolResponse } from '../types/index.js';

// Import tools and handlers
import {
  workflowTools,
  handleCreateWorkflow,
  handleGetWorkflow,
  handleUpdateWorkflow,
  handleDeleteWorkflow,
  handleListWorkflows,
  handleActivateWorkflow,
  handleDeactivateWorkflow,
} from './workflows.js';

import {
  executionTools,
  handleTriggerWebhookWorkflow,
  handleGetExecution,
  handleListExecutions,
  handleDeleteExecution,
} from './executions.js';

import { healthTool, handleHealthCheck } from './health.js';

// Export all tools
export const allTools: Tool[] = [
  ...workflowTools,
  ...executionTools,
  healthTool,
];

// Export handler mapping
export const toolHandlers: Map<string, (args: unknown, client: N8nApiClient) => Promise<McpToolResponse>> = new Map([
  // Workflow handlers
  ['n8n_create_workflow', handleCreateWorkflow],
  ['n8n_get_workflow', handleGetWorkflow],
  ['n8n_update_workflow', handleUpdateWorkflow],
  ['n8n_delete_workflow', handleDeleteWorkflow],
  ['n8n_list_workflows', handleListWorkflows],
  ['n8n_activate_workflow', handleActivateWorkflow],
  ['n8n_deactivate_workflow', handleDeactivateWorkflow],
  
  // Execution handlers
  ['n8n_trigger_webhook_workflow', handleTriggerWebhookWorkflow],
  ['n8n_get_execution', handleGetExecution],
  ['n8n_list_executions', handleListExecutions],
  ['n8n_delete_execution', handleDeleteExecution],
  
  // Health handler
  ['n8n_health_check', handleHealthCheck],
]);