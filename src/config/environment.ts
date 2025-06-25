import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment schema
const envSchema = z.object({
  // n8n configuration
  N8N_API_URL: z.string().url().describe('n8n instance API URL'),
  N8N_API_KEY: z.string().min(1).describe('n8n API key'),
  
  // Server configuration
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Rate limiting
  RATE_LIMIT_MAX: z.coerce.number().positive().default(60),
  RATE_LIMIT_WINDOW: z.coerce.number().positive().default(60000), // milliseconds
  
  // Cache configuration
  CACHE_TTL: z.coerce.number().positive().default(300), // seconds
  
  // Request configuration
  REQUEST_TIMEOUT: z.coerce.number().positive().default(30000), // milliseconds
  MAX_CONCURRENT_REQUESTS: z.coerce.number().positive().default(10),
});

// Parse and validate environment
function loadEnvironment() {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('Environment validation failed:');
    console.error(result.error.format());
    process.exit(1);
  }
  
  return result.data;
}

// Export validated environment configuration
export const config = loadEnvironment();

// Type export for use in other modules
export type Config = typeof config;