import winston from 'winston';
import { config } from '../config/environment.js';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Detect if running as MCP server (stdio mode)
const isMcpMode = process.env.MCP_MODE === 'stdio' || 
                  process.argv.includes('--mcp') ||
                  !process.stdout.isTTY;

// Create logs directory
const logsDir = join(homedir(), '.n8n-manager', 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Custom format for development
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// JSON format for production
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array based on mode
const transports: winston.transport[] = [];

// Always add file transport
transports.push(
  new winston.transports.File({
    filename: join(logsDir, 'n8n-manager.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  })
);

// Only add console transport if NOT in MCP mode
if (!isMcpMode) {
  transports.push(
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: config.NODE_ENV === 'development' && !isMcpMode ? devFormat : prodFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Log unhandled errors
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Export typed logger methods
export const log = {
  debug: (message: string, meta?: Record<string, unknown>) => logger.debug(message, meta),
  info: (message: string, meta?: Record<string, unknown>) => logger.info(message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => logger.warn(message, meta),
  error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
    if (error instanceof Error) {
      logger.error(message, { ...meta, error: error.message, stack: error.stack });
    } else {
      logger.error(message, { ...meta, error });
    }
  },
};