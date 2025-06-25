import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { log } from '../utils/logger.js';
import {
  Workflow,
  WorkflowListParams,
  WorkflowListResponse,
  Execution,
  ExecutionListParams,
  ExecutionListResponse,
  Credential,
  CredentialListParams,
  CredentialListResponse,
  Tag,
  TagListParams,
  TagListResponse,
  HealthCheckResponse,
  Variable,
  WebhookRequest,
  WorkflowExport,
  WorkflowImport,
  SourceControlStatus,
  SourceControlPullResult,
  SourceControlPushResult,
} from '../types/index.js';

export interface N8nApiClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  maxRetries?: number;
}

export class N8nApiClient {
  private client: AxiosInstance;
  private maxRetries: number;

  constructor(config: N8nApiClientConfig) {
    const { baseUrl, apiKey, timeout = 30000, maxRetries = 3 } = config;

    this.maxRetries = maxRetries;

    // Ensure baseUrl ends with /api/v1
    const apiUrl = baseUrl.endsWith('/api/v1') 
      ? baseUrl 
      : `${baseUrl.replace(/\/$/, '')}/api/v1`;

    this.client = axios.create({
      baseURL: apiUrl,
      timeout,
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        log.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data,
        });
        return config;
      },
      (error: unknown) => {
        log.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response: any) => {
        log.debug(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: unknown) => {
        log.error('API Response Error:', error);
        return Promise.reject(error);
      }
    );
  }

  private async request<T>(config: AxiosRequestConfig, retries = 0): Promise<T> {
    try {
      const response = await this.client.request<T>(config);
      return response.data;
    } catch (error) {
      if (retries < this.maxRetries && this.shouldRetry(error)) {
        log.warn(`Retrying request (${retries + 1}/${this.maxRetries})...`);
        await this.delay(Math.pow(2, retries) * 1000);
        return this.request<T>(config, retries + 1);
      }
      throw error;
    }
  }

  private shouldRetry(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      return status === 429 || status === 503 || status === 504 || !error.response;
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health Check
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      // Try to list workflows with limit 1 as a health check
      await this.request<WorkflowListResponse>({
        method: 'GET',
        url: '/workflows',
        params: { limit: 1 },
      });

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Workflow Operations
  async createWorkflow(workflow: Workflow): Promise<Workflow> {
    return this.request<Workflow>({
      method: 'POST',
      url: '/workflows',
      data: workflow,
    });
  }

  async getWorkflow(id: string): Promise<Workflow> {
    return this.request<Workflow>({
      method: 'GET',
      url: `/workflows/${id}`,
    });
  }

  async updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<Workflow> {
    // First try PUT, then fall back to PATCH if PUT fails
    try {
      return await this.request<Workflow>({
        method: 'PUT',
        url: `/workflows/${id}`,
        data: workflow,
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 405) {
        // If PUT is not allowed, try PATCH
        return this.request<Workflow>({
          method: 'PATCH',
          url: `/workflows/${id}`,
          data: workflow,
        });
      }
      throw error;
    }
  }

  async deleteWorkflow(id: string): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/workflows/${id}`,
    });
  }

  async listWorkflows(params?: WorkflowListParams): Promise<WorkflowListResponse> {
    return this.request<WorkflowListResponse>({
      method: 'GET',
      url: '/workflows',
      params,
    });
  }

  async activateWorkflow(id: string): Promise<Workflow> {
    try {
      // First try simple PUT with just active flag
      return await this.request<Workflow>({
        method: 'PUT',
        url: `/workflows/${id}`,
        data: { active: true },
      });
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 405 || error.response?.status === 400)) {
        // If PUT with partial data fails, fetch full workflow and update it
        try {
          const workflow = await this.getWorkflow(id);
          workflow.active = true;
          return await this.request<Workflow>({
            method: 'PUT',
            url: `/workflows/${id}`,
            data: workflow,
          });
        } catch (putError) {
          // Last resort: try PATCH
          return this.request<Workflow>({
            method: 'PATCH',
            url: `/workflows/${id}`,
            data: { active: true },
          });
        }
      }
      throw error;
    }
  }

  async deactivateWorkflow(id: string): Promise<Workflow> {
    try {
      // First try simple PUT with just active flag
      return await this.request<Workflow>({
        method: 'PUT',
        url: `/workflows/${id}`,
        data: { active: false },
      });
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 405 || error.response?.status === 400)) {
        // If PUT with partial data fails, fetch full workflow and update it
        try {
          const workflow = await this.getWorkflow(id);
          workflow.active = false;
          return await this.request<Workflow>({
            method: 'PUT',
            url: `/workflows/${id}`,
            data: workflow,
          });
        } catch (putError) {
          // Last resort: try PATCH
          return this.request<Workflow>({
            method: 'PATCH',
            url: `/workflows/${id}`,
            data: { active: false },
          });
        }
      }
      throw error;
    }
  }

  // Execution Operations
  async getExecution(id: string, includeData = false): Promise<Execution> {
    return this.request<Execution>({
      method: 'GET',
      url: `/executions/${id}`,
      params: { includeData },
    });
  }

  async listExecutions(params?: ExecutionListParams): Promise<ExecutionListResponse> {
    return this.request<ExecutionListResponse>({
      method: 'GET',
      url: '/executions',
      params,
    });
  }

  async deleteExecution(id: string): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/executions/${id}`,
    });
  }

  // Webhook execution (workaround for direct execution)
  async triggerWebhookWorkflow(webhook: WebhookRequest): Promise<unknown> {
    const { webhookUrl, httpMethod, data, headers, waitForResponse } = webhook;

    // Make request directly to the webhook URL
    const response = await axios.request({
      method: httpMethod,
      url: webhookUrl,
      data,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      timeout: waitForResponse ? 60000 : 5000,
    });

    return response.data;
  }

  // Credential Operations
  async createCredential(credential: Credential): Promise<Credential> {
    return this.request<Credential>({
      method: 'POST',
      url: '/credentials',
      data: credential,
    });
  }

  async getCredential(id: string): Promise<Credential> {
    return this.request<Credential>({
      method: 'GET',
      url: `/credentials/${id}`,
    });
  }

  async updateCredential(id: string, credential: Partial<Credential>): Promise<Credential> {
    return this.request<Credential>({
      method: 'PATCH',
      url: `/credentials/${id}`,
      data: credential,
    });
  }

  async deleteCredential(id: string): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/credentials/${id}`,
    });
  }

  async listCredentials(params?: CredentialListParams): Promise<CredentialListResponse> {
    return this.request<CredentialListResponse>({
      method: 'GET',
      url: '/credentials',
      params,
    });
  }

  // Tag Operations
  async createTag(name: string): Promise<Tag> {
    return this.request<Tag>({
      method: 'POST',
      url: '/tags',
      data: { name },
    });
  }

  async updateTag(id: string, name: string): Promise<Tag> {
    return this.request<Tag>({
      method: 'PATCH',
      url: `/tags/${id}`,
      data: { name },
    });
  }

  async deleteTag(id: string): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/tags/${id}`,
    });
  }

  async listTags(params?: TagListParams): Promise<TagListResponse> {
    return this.request<TagListResponse>({
      method: 'GET',
      url: '/tags',
      params,
    });
  }

  // Export/Import Operations
  async exportWorkflow(id: string): Promise<WorkflowExport> {
    return this.request<WorkflowExport>({
      method: 'GET',
      url: `/workflows/${id}`,
      params: { includeCredentials: false },
    });
  }

  async importWorkflow(workflow: WorkflowImport): Promise<Workflow> {
    return this.request<Workflow>({
      method: 'POST',
      url: '/workflows',
      data: workflow.workflowData,
    });
  }

  async exportAllWorkflows(): Promise<WorkflowExport[]> {
    const workflows: WorkflowExport[] = [];
    let cursor: string | undefined;

    do {
      const response = await this.listWorkflows({ limit: 100, cursor });
      
      for (const workflow of response.data) {
        if (workflow.id) {
          const fullWorkflow = await this.exportWorkflow(workflow.id);
          workflows.push(fullWorkflow);
        }
      }

      cursor = response.nextCursor;
    } while (cursor);

    return workflows;
  }

  // Source Control Operations
  async getSourceControlStatus(): Promise<SourceControlStatus> {
    return this.request<SourceControlStatus>({
      method: 'GET',
      url: '/source-control/status',
    });
  }

  async pullFromSourceControl(force = false): Promise<SourceControlPullResult> {
    return this.request<SourceControlPullResult>({
      method: 'POST',
      url: '/source-control/pull',
      data: { force },
    });
  }

  async pushToSourceControl(message: string, workflowIds?: string[]): Promise<SourceControlPushResult> {
    return this.request<SourceControlPushResult>({
      method: 'POST',
      url: '/source-control/push',
      data: { message, workflowIds },
    });
  }

  // Variable Operations (via source control)
  async updateVariables(_variables: Variable[]): Promise<void> {
    // Variables are managed through source control
    // This is a placeholder for the actual implementation
    log.warn('Variable management through source control API not yet implemented');
  }
}