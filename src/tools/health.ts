import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { N8nApiClient } from '../services/n8nClient.js';
import { McpToolResponse } from '../types/index.js';
import { config } from '../config/environment.js';
import { log } from '../utils/logger.js';

// Zod schema for validation
const healthCheckSchema = z.object({
  instance: z.string().optional(),
});

// Tool definition
export const healthTool: Tool = {
  name: 'n8n_health_check',
  description: `Check n8n instance health and API connectivity.
Returns: Health status (✅ Healthy/❌ Unhealthy), API URL, response time, configuration details (log level, timeout, rate limits).
Useful for debugging connection issues before attempting other operations.`,
  inputSchema: {
    type: 'object',
    properties: {
      instance: { 
        type: 'string', 
        description: 'Instance name (for multi-instance setups)' 
      },
    },
  },
};

// Tool handler
export async function handleHealthCheck(
  args: unknown,
  client: N8nApiClient
): Promise<McpToolResponse> {
  const params = healthCheckSchema.parse(args || {});
  
  log.info('Performing health check', { instance: params.instance });
  
  const startTime = Date.now();
  const health = await client.healthCheck();
  const responseTime = Date.now() - startTime;
  
  let text = `n8n Health Check Results:\n`;
  text += `Status: ${health.status === 'ok' ? '✅ Healthy' : '❌ Unhealthy'}\n`;
  text += `API URL: ${config.N8N_API_URL}\n`;
  text += `Response Time: ${responseTime}ms\n`;
  text += `Timestamp: ${health.timestamp}\n`;
  
  if (health.version) {
    text += `Version: ${health.version}\n`;
  }
  
  if (health.instanceId) {
    text += `Instance ID: ${health.instanceId}\n`;
  }
  
  if (params.instance) {
    text += `Instance Name: ${params.instance}\n`;
  }
  
  // Add configuration info
  text += `\nConfiguration:`;
  text += `\n- Log Level: ${config.LOG_LEVEL}`;
  text += `\n- Environment: ${config.NODE_ENV}`;
  text += `\n- Request Timeout: ${config.REQUEST_TIMEOUT}ms`;
  text += `\n- Rate Limit: ${config.RATE_LIMIT_MAX} requests per ${config.RATE_LIMIT_WINDOW}ms`;
  text += `\n- Cache TTL: ${config.CACHE_TTL}s`;
  
  if (health.status !== 'ok') {
    text += `\n\n⚠️ Connection Issues Detected:`;
    text += `\n- Check if n8n instance is running`;
    text += `\n- Verify API URL is correct`;
    text += `\n- Ensure API key has valid permissions`;
    text += `\n- Check network connectivity`;
  }
  
  return {
    content: [{
      type: 'text',
      text,
    }],
  };
}