import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { N8nApiClient } from '../services/n8nClient.js';
import { Workflow, McpToolResponse } from '../types/index.js';

// Zod schemas for validation
const workflowNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  typeVersion: z.number(),
  position: z.tuple([z.number(), z.number()]),
  parameters: z.record(z.unknown()),
  credentials: z.record(z.string()).optional(),
  disabled: z.boolean().optional(),
  notes: z.string().optional(),
  notesInFlow: z.boolean().optional(),
  continueOnFail: z.boolean().optional(),
  retryOnFail: z.boolean().optional(),
  maxTries: z.number().optional(),
  waitBetweenTries: z.number().optional(),
  alwaysOutputData: z.boolean().optional(),
  executeOnce: z.boolean().optional(),
});

const workflowConnectionSchema = z.record(
  z.object({
    main: z.array(
      z.array(
        z.object({
          node: z.string(),
          type: z.string(),
          index: z.number(),
        })
      )
    ),
  })
);

const createWorkflowSchema = z.object({
  name: z.string(),
  nodes: z.array(workflowNodeSchema),
  connections: workflowConnectionSchema,
  active: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  settings: z.object({
    executionOrder: z.enum(['v0', 'v1']).default('v1'),
    timezone: z.string().optional(),
    saveDataErrorExecution: z.enum(['all', 'none']).default('all'),
    saveDataSuccessExecution: z.enum(['all', 'none']).default('all'),
    saveManualExecutions: z.boolean().default(true),
    saveExecutionProgress: z.boolean().default(true),
    executionTimeout: z.number().optional(),
    errorWorkflow: z.string().optional(),
  }).default({
    executionOrder: 'v1',
    saveDataErrorExecution: 'all',
    saveDataSuccessExecution: 'all',
    saveManualExecutions: true,
    saveExecutionProgress: true,
  }),
});

const updateWorkflowSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  nodes: z.array(workflowNodeSchema).optional(),
  connections: workflowConnectionSchema.optional(),
  active: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  settings: z.object({
    executionOrder: z.enum(['v0', 'v1']).default('v1'),
    timezone: z.string().optional(),
    saveDataErrorExecution: z.enum(['all', 'none']).default('all'),
    saveDataSuccessExecution: z.enum(['all', 'none']).default('all'),
    saveManualExecutions: z.boolean().default(true),
    saveExecutionProgress: z.boolean().default(true),
    executionTimeout: z.number().optional(),
    errorWorkflow: z.string().optional(),
  }).default({
    executionOrder: 'v1',
    saveDataErrorExecution: 'all',
    saveDataSuccessExecution: 'all',
    saveManualExecutions: true,
    saveExecutionProgress: true,
  }),
});

const listWorkflowsSchema = z.object({
  limit: z.number().min(1).max(100).default(100),
  cursor: z.string().optional(),
  active: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  projectId: z.string().optional(),
  excludePinnedData: z.boolean().default(true),
  instance: z.string().optional(),
});

// Tool definitions
export const workflowTools: Tool[] = [
  {
    name: 'n8n_create_workflow',
    description: 'Create a new n8n workflow with nodes and connections',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Workflow name' },
        nodes: { 
          type: 'array', 
          description: 'Array of workflow nodes',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              typeVersion: { type: 'number' },
              position: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
              parameters: { type: 'object' },
            },
            required: ['id', 'name', 'type', 'typeVersion', 'position', 'parameters'],
          },
        },
        connections: { type: 'object', description: 'Node connection mappings' },
        active: { type: 'boolean', description: 'Activate on creation', default: false },
        tags: { type: 'array', items: { type: 'string' } },
        settings: {
          type: 'object',
          description: 'Workflow settings (required by n8n API)',
          properties: {
            executionOrder: { type: 'string', enum: ['v0', 'v1'], default: 'v1' },
            saveDataErrorExecution: { type: 'string', enum: ['all', 'none'], default: 'all' },
            saveDataSuccessExecution: { type: 'string', enum: ['all', 'none'], default: 'all' },
            saveManualExecutions: { type: 'boolean', default: true },
            saveExecutionProgress: { type: 'boolean', default: true },
          },
        },
      },
      required: ['name', 'nodes', 'connections'],
    },
  },
  {
    name: 'n8n_get_workflow',
    description: 'Retrieve a specific workflow by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Workflow ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'n8n_update_workflow',
    description: 'Update an existing workflow',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Workflow ID' },
        name: { type: 'string', description: 'Updated workflow name' },
        nodes: { type: 'array', description: 'Updated nodes configuration' },
        connections: { type: 'object', description: 'Updated connections' },
        active: { type: 'boolean', description: 'Activation status' },
      },
      required: ['id'],
    },
  },
  {
    name: 'n8n_delete_workflow',
    description: 'Delete a workflow permanently',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Workflow ID to delete' },
      },
      required: ['id'],
    },
  },
  {
    name: 'n8n_list_workflows',
    description: 'List all workflows with filtering options (uses cursor-based pagination)',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of results', default: 100, maximum: 100 },
        cursor: { type: 'string', description: 'Pagination cursor from previous response' },
        active: { type: 'boolean', description: 'Filter by active status' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
        projectId: { type: 'string', description: 'Filter by project (Enterprise only)' },
        excludePinnedData: { type: 'boolean', description: 'Exclude pinned node data', default: true },
        instance: { type: 'string', description: 'n8n instance to query (for multi-instance setups)' },
      },
    },
  },
  {
    name: 'n8n_activate_workflow',
    description: 'Activate a workflow to enable triggers',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Workflow ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'n8n_deactivate_workflow',
    description: 'Deactivate a workflow to disable triggers',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Workflow ID' },
      },
      required: ['id'],
    },
  },
];

// Tool handlers
export async function handleCreateWorkflow(
  args: unknown,
  client: N8nApiClient
): Promise<McpToolResponse> {
  const params = createWorkflowSchema.parse(args);
  
  const workflow = await client.createWorkflow(params as Workflow);
  
  return {
    content: [{
      type: 'text',
      text: `Created workflow "${workflow.name}" with ID: ${workflow.id}\nActive: ${workflow.active ? 'Yes' : 'No'}\nNodes: ${workflow.nodes.length}\nTags: ${workflow.tags?.join(', ') || 'None'}`,
    }],
  };
}

export async function handleGetWorkflow(
  args: unknown,
  client: N8nApiClient
): Promise<McpToolResponse> {
  const params = z.object({ id: z.string() }).parse(args);
  
  const workflow = await client.getWorkflow(params.id);
  
  return {
    content: [{
      type: 'text',
      text: `Workflow: ${workflow.name} (ID: ${workflow.id})
Active: ${workflow.active ? 'Yes' : 'No'}
Nodes: ${workflow.nodes.length}
Created: ${workflow.createdAt || 'Unknown'}
Updated: ${workflow.updatedAt || 'Unknown'}
Tags: ${workflow.tags?.join(', ') || 'None'}
Settings: ${JSON.stringify(workflow.settings || {}, null, 2)}`,
    }],
  };
}

export async function handleUpdateWorkflow(
  args: unknown,
  client: N8nApiClient
): Promise<McpToolResponse> {
  const params = updateWorkflowSchema.parse(args);
  const { id, ...updateData } = params;
  
  // If updating without full workflow data, fetch existing workflow first
  // to ensure we have all required fields for PUT operation
  if (!updateData.nodes || !updateData.connections) {
    try {
      const existingWorkflow = await client.getWorkflow(id);
      // Merge update data with existing workflow
      Object.assign(existingWorkflow, updateData);
      const workflow = await client.updateWorkflow(id, existingWorkflow);
      
      return {
        content: [{
          type: 'text',
          text: `Updated workflow "${workflow.name}" (ID: ${workflow.id})\nActive: ${workflow.active ? 'Yes' : 'No'}`,
        }],
      };
    } catch (error) {
      // Fall back to partial update if fetch fails
      const workflow = await client.updateWorkflow(id, updateData as Partial<Workflow>);
      
      return {
        content: [{
          type: 'text',
          text: `Updated workflow "${workflow.name}" (ID: ${workflow.id})\nActive: ${workflow.active ? 'Yes' : 'No'}`,
        }],
      };
    }
  }
  
  const workflow = await client.updateWorkflow(id, updateData as Partial<Workflow>);
  
  return {
    content: [{
      type: 'text',
      text: `Updated workflow "${workflow.name}" (ID: ${workflow.id})\nActive: ${workflow.active ? 'Yes' : 'No'}`,
    }],
  };
}

export async function handleDeleteWorkflow(
  args: unknown,
  client: N8nApiClient
): Promise<McpToolResponse> {
  const params = z.object({ id: z.string() }).parse(args);
  
  await client.deleteWorkflow(params.id);
  
  return {
    content: [{
      type: 'text',
      text: `Successfully deleted workflow with ID: ${params.id}`,
    }],
  };
}

export async function handleListWorkflows(
  args: unknown,
  client: N8nApiClient
): Promise<McpToolResponse> {
  const params = listWorkflowsSchema.parse(args || {});
  
  const response = await client.listWorkflows(params);
  
  let text = `Found ${response.data.length} workflows`;
  
  if (response.nextCursor) {
    text += `\nMore results available. Next cursor: ${response.nextCursor}`;
  }
  
  text += '\n\nWorkflows:';
  
  for (const workflow of response.data) {
    text += `\n- ${workflow.name} (ID: ${workflow.id}) - ${workflow.active ? 'Active' : 'Inactive'}`;
    if (workflow.tags && workflow.tags.length > 0) {
      text += ` [${workflow.tags.join(', ')}]`;
    }
  }
  
  return {
    content: [{
      type: 'text',
      text,
    }],
  };
}

export async function handleActivateWorkflow(
  args: unknown,
  client: N8nApiClient
): Promise<McpToolResponse> {
  const params = z.object({ id: z.string() }).parse(args);
  
  const workflow = await client.activateWorkflow(params.id);
  
  return {
    content: [{
      type: 'text',
      text: `Successfully activated workflow "${workflow.name}" (ID: ${workflow.id})`,
    }],
  };
}

export async function handleDeactivateWorkflow(
  args: unknown,
  client: N8nApiClient
): Promise<McpToolResponse> {
  const params = z.object({ id: z.string() }).parse(args);
  
  const workflow = await client.deactivateWorkflow(params.id);
  
  return {
    content: [{
      type: 'text',
      text: `Successfully deactivated workflow "${workflow.name}" (ID: ${workflow.id})`,
    }],
  };
}