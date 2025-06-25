#!/usr/bin/env node

import { N8nMcpServer } from './server.js';
import { log } from './utils/logger.js';

// Handle process termination gracefully
process.on('SIGINT', () => {
  log.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Main function
async function main(): Promise<void> {
  try {
    log.info('n8n MCP Server starting...');
    
    const server = new N8nMcpServer();
    await server.start();
    
    // Keep the process running
    process.stdin.resume();
  } catch (error) {
    log.error('Fatal error during startup:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  log.error('Unhandled error:', error);
  process.exit(1);
});