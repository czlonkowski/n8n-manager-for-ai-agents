import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from './config/environment.js';
import { log } from './utils/logger.js';
import { createErrorResponse, ErrorCode, McpError } from './utils/errors.js';
import { N8nApiClient } from './services/n8nClient.js';
import { allTools, toolHandlers } from './tools/index.js';

export class N8nMcpServer {
  private server: Server;
  private n8nClient: N8nApiClient;
  private tools: Map<string, Tool> = new Map();
  private toolHandlers: Map<string, (args: unknown) => Promise<unknown>> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: 'n8n-mcp-server',
        vendor: 'n8n-manager-for-ai-agents',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.n8nClient = new N8nApiClient({
      baseUrl: config.N8N_API_URL,
      apiKey: config.N8N_API_KEY,
      timeout: config.REQUEST_TIMEOUT,
    });

    this.setupHandlers();
    this.registerTools();
  }

  private setupHandlers(): void {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.tools.values()),
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      log.info(`Executing tool: ${name}`, { args });

      const handler = this.toolHandlers.get(name);
      if (!handler) {
        throw new McpError(
          ErrorCode.NOT_FOUND,
          `Tool not found: ${name}`
        );
      }

      try {
        const result = await handler(args);
        return result as { [x: string]: unknown };
      } catch (error) {
        log.error(`Tool execution failed: ${name}`, error);
        const errorResponse = createErrorResponse(error);
        return errorResponse as unknown as { [x: string]: unknown };
      }
    });
  }

  private registerTools(): void {
    const isMcpMode = process.env.MCP_MODE === 'stdio' || 
                      process.argv.includes('--mcp') ||
                      !process.stdout.isTTY;
    
    // Register all tools from the tools directory
    for (const tool of allTools) {
      const handler = toolHandlers.get(tool.name);
      if (handler) {
        this.registerToolFromModule(tool, handler);
      } else {
        log.warn(`No handler found for tool: ${tool.name}`);
      }
    }

    if (!isMcpMode) {
      log.info(`Registered ${this.tools.size} tools`);
    }
  }

  private registerTool(
    tool: Tool,
    handler: (args: unknown) => Promise<unknown>
  ): void {
    this.tools.set(tool.name, tool);
    this.toolHandlers.set(tool.name, handler);
  }

  public getN8nClient(): N8nApiClient {
    return this.n8nClient;
  }

  public registerToolFromModule(
    tool: Tool,
    handler: (args: unknown, client: N8nApiClient) => Promise<unknown>
  ): void {
    this.registerTool(tool, (args) => handler(args, this.n8nClient));
  }

  public async start(): Promise<void> {
    // Detect MCP mode
    const isMcpMode = process.env.MCP_MODE === 'stdio' || 
                      process.argv.includes('--mcp') ||
                      !process.stdout.isTTY;
    
    if (!isMcpMode) {
      log.info('Starting n8n MCP server...');
    }
    
    try {
      // Test n8n connection
      const health = await this.n8nClient.healthCheck();
      if (!isMcpMode) {
        log.info('Connected to n8n instance', {
          status: health.status,
          version: health.version,
        });
      }
    } catch (error) {
      log.error('Failed to connect to n8n instance', error);
      if (!isMcpMode) {
        log.warn('Server will start but n8n operations may fail');
      }
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    if (!isMcpMode) {
      log.info('n8n MCP server started successfully');
    }
  }
}