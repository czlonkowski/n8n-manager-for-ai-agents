// n8n Workflow Node Types

export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
  credentials?: Record<string, string>;
  disabled?: boolean;
  notes?: string;
  notesInFlow?: boolean;
  continueOnFail?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  alwaysOutputData?: boolean;
  executeOnce?: boolean;
}

export interface WorkflowConnection {
  [sourceNodeId: string]: {
    main: Array<Array<{
      node: string;
      type: string;
      index: number;
    }>>;
  };
}

export interface WorkflowSettings {
  executionOrder?: 'v0' | 'v1';
  timezone?: string;
  saveDataErrorExecution?: 'all' | 'none';
  saveDataSuccessExecution?: 'all' | 'none';
  saveManualExecutions?: boolean;
  saveExecutionProgress?: boolean;
  executionTimeout?: number;
  errorWorkflow?: string;
}

export interface Workflow {
  id?: string;
  name: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection;
  active: boolean;
  settings?: WorkflowSettings;
  staticData?: Record<string, unknown>;
  tags?: string[];
  updatedAt?: string;
  createdAt?: string;
  versionId?: string;
  meta?: {
    instanceId?: string;
  };
}

// Execution Types

export enum ExecutionStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  WAITING = 'waiting',
  // Note: 'running' status is not returned by the API
}

export interface ExecutionSummary {
  id: string;
  finished: boolean;
  mode: string;
  retryOf?: string;
  retrySuccessId?: string;
  status: ExecutionStatus;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  workflowName?: string;
  waitTill?: string;
}

export interface ExecutionData {
  startData?: Record<string, unknown>;
  resultData: {
    runData: Record<string, unknown>;
    lastNodeExecuted?: string;
    error?: Record<string, unknown>;
  };
  executionData?: Record<string, unknown>;
}

export interface Execution extends ExecutionSummary {
  data?: ExecutionData;
}

// Credential Types

export interface Credential {
  id?: string;
  name: string;
  type: string;
  nodesAccess?: Array<{
    nodeType: string;
    date?: string;
  }>;
  data?: Record<string, unknown>; // Encrypted data
  createdAt?: string;
  updatedAt?: string;
}

// Tag Types

export interface Tag {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  usageCount?: number;
}

// API Response Types

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
}

export interface WorkflowListResponse extends PaginatedResponse<Workflow> {}

export interface ExecutionListResponse extends PaginatedResponse<ExecutionSummary> {}

export interface CredentialListResponse extends PaginatedResponse<Credential> {}

export interface TagListResponse extends PaginatedResponse<Tag> {}

// API Request Types

export interface WorkflowListParams {
  limit?: number;
  cursor?: string;
  active?: boolean;
  tags?: string[];
  projectId?: string;
  excludePinnedData?: boolean;
}

export interface ExecutionListParams {
  limit?: number;
  cursor?: string;
  workflowId?: string;
  projectId?: string;
  status?: ExecutionStatus;
  includeData?: boolean;
}

export interface CredentialListParams {
  limit?: number;
  cursor?: string;
  type?: string;
}

export interface TagListParams {
  limit?: number;
  cursor?: string;
}

// Health Check Types

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  version?: string;
  instanceId?: string;
  timestamp: string;
}

// Variable Types

export interface Variable {
  key: string;
  value: string;
}

// Webhook Types

export interface WebhookRequest {
  webhookUrl: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: Record<string, unknown>;
  headers?: Record<string, string>;
  waitForResponse?: boolean;
}

// MCP Tool Response Types

export interface McpToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

// Export/Import Types

export interface WorkflowExport extends Workflow {
  pinData?: Record<string, unknown>;
}

export interface WorkflowImport {
  workflowData: WorkflowExport;
  activate?: boolean;
}

// Source Control Types

export interface SourceControlStatus {
  branches: string[];
  currentBranch: string;
  modified: string[];
  conflicted: string[];
  notInRemote: string[];
  notInLocal: string[];
}

export interface SourceControlPullResult {
  success: boolean;
  pulled: number;
  conflicts?: string[];
}

export interface SourceControlPushResult {
  success: boolean;
  pushed: number;
  message: string;
}