import { z } from 'zod';

// Common validation schemas for n8n API inputs

export const paginationSchema = z.object({
  limit: z.number().min(1).max(100).default(100),
  cursor: z.string().optional(),
});

export const idSchema = z.object({
  id: z.string().min(1),
});

export const webhookUrlSchema = z.string().url().refine(
  (url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },
  { message: 'Invalid webhook URL' }
);

export const httpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'DELETE']);

// Validate workflow name
export const workflowNameSchema = z.string()
  .min(1, 'Workflow name cannot be empty')
  .max(128, 'Workflow name too long');

// Validate node ID format
export const nodeIdSchema = z.string()
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid node ID format');

// Validate tag name
export const tagNameSchema = z.string()
  .min(1, 'Tag name cannot be empty')
  .max(50, 'Tag name too long');

// Helper function to safely parse with better error messages
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.errors
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    
    throw new Error(
      context 
        ? `Validation failed for ${context}: ${errors}`
        : `Validation failed: ${errors}`
    );
  }
  
  return result.data;
}