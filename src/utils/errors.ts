import { log } from './logger.js';

// AxiosError interface
interface AxiosError extends Error {
  response?: {
    status?: number;
    statusText?: string;
    data?: unknown;
  };
  code?: string;
  isAxiosError: boolean;
}

// MCP error codes
export enum ErrorCode {
  INVALID_PARAMS = 'INVALID_PARAMS',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  API_ERROR = 'API_ERROR',
}

// Custom error class for MCP errors
export class McpError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'McpError';
  }
}

// Error response format for MCP
export interface ErrorResponse {
  isError: true;
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

// Create MCP-compliant error response
export function createErrorResponse(error: unknown): ErrorResponse {
  let message: string;
  let code: ErrorCode = ErrorCode.INTERNAL_ERROR;

  if (error instanceof McpError) {
    message = error.message;
    code = error.code;
  } else if (isAxiosError(error)) {
    const axiosError = handleAxiosError(error);
    message = axiosError.message;
    code = axiosError.code;
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = 'An unexpected error occurred';
  }

  // Log the error
  log.error(`MCP Error [${code}]:`, error);

  return {
    isError: true,
    content: [{
      type: 'text',
      text: `Error: ${message}`,
    }],
  };
}

// Type guard for AxiosError
function isAxiosError(error: unknown): error is AxiosError {
  return error !== null && 
         typeof error === 'object' && 
         'isAxiosError' in error &&
         (error as any).isAxiosError === true;
}

// Handle Axios errors and map to MCP error codes
function handleAxiosError(error: AxiosError): { message: string; code: ErrorCode } {
  const status = error.response?.status;
  const statusText = error.response?.statusText;
  const apiMessage = (error.response?.data as { message?: string })?.message;
  const config = (error as any).config;

  let message: string;
  let code: ErrorCode;

  switch (status) {
    case 400:
      code = ErrorCode.INVALID_PARAMS;
      if (apiMessage?.includes('settings')) {
        message = 'Workflow settings are required. The n8n API requires a settings object with executionOrder, saveData options, etc.';
      } else {
        message = apiMessage || 'Bad request. The request parameters are invalid.';
      }
      break;
    case 401:
      code = ErrorCode.AUTHENTICATION_ERROR;
      message = 'Authentication failed. Please check your n8n API key.';
      break;
    case 403:
      code = ErrorCode.AUTHORIZATION_ERROR;
      message = 'You do not have permission to perform this action.';
      break;
    case 404:
      code = ErrorCode.NOT_FOUND;
      message = apiMessage || 'The requested resource was not found.';
      break;
    case 405:
      code = ErrorCode.API_ERROR;
      message = `Method not allowed. The n8n instance does not support ${config?.method || 'this method'} for this endpoint.`;
      if (config?.url?.includes('/workflows') && config?.method === 'PATCH') {
        message += ' Some n8n instances require PUT method for workflow updates instead of PATCH.';
      }
      break;
    case 429:
      code = ErrorCode.RATE_LIMIT_ERROR;
      message = 'Rate limit exceeded. Please try again later.';
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      code = ErrorCode.API_ERROR;
      message = `n8n server error: ${statusText || 'Internal server error'}`;
      break;
    default:
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        code = ErrorCode.TIMEOUT_ERROR;
        message = 'Request timed out. Please try again.';
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        code = ErrorCode.NETWORK_ERROR;
        message = 'Unable to connect to n8n instance. Please check your API URL.';
      } else {
        code = ErrorCode.API_ERROR;
        message = apiMessage || error.message || 'An error occurred while communicating with n8n';
      }
  }

  return { message, code };
}

// Wrapper for async operations with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (errorMessage) {
      throw new McpError(ErrorCode.INTERNAL_ERROR, errorMessage, error);
    }
    throw error;
  }
}

// Validate required parameters
export function validateRequiredParams(
  params: Record<string, unknown>,
  required: string[]
): void {
  const missing = required.filter(param => !params[param]);
  
  if (missing.length > 0) {
    throw new McpError(
      ErrorCode.INVALID_PARAMS,
      `Missing required parameters: ${missing.join(', ')}`
    );
  }
}

// Sanitize error messages to avoid leaking sensitive information
export function sanitizeErrorMessage(message: string): string {
  // Remove potential API keys or sensitive data from error messages
  return message
    .replace(/X-N8N-API-KEY:\s*\S+/gi, 'X-N8N-API-KEY: [REDACTED]')
    .replace(/api[_-]?key["\s:=]+["']?[\w-]+["']?/gi, 'api_key: [REDACTED]')
    .replace(/Bearer\s+[\w-]+/gi, 'Bearer [REDACTED]');
}