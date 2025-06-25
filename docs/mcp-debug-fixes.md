# MCP Server Debug Fixes

## Issues Identified

1. **JSON Parsing Errors in Claude Desktop**
   - Error: "Unexpected non-whitespace character after JSON"
   - Cause: Logger was outputting formatted text to stdout, interfering with MCP protocol

2. **Root Cause**
   - MCP protocol requires clean JSON-RPC communication via stdio
   - Our Winston logger was writing colored/formatted logs to stdout
   - Any non-JSON output breaks the protocol

## Fixes Applied

### 1. Updated Logger Configuration (`src/utils/logger.ts`)
- Added MCP mode detection
- Redirected all logs to file (`~/.n8n-manager/logs/n8n-manager.log`)
- Disabled console output when running in MCP mode
- Logs are still available in the file for debugging

### 2. Updated Environment Configuration (`src/config/environment.ts`)
- Replaced `console.error` with `process.stderr.write`
- Only writes to stderr when TTY is available
- Prevents error messages from corrupting stdout

### 3. Updated Server Files (`src/index.ts`, `src/server.ts`)
- Added MCP mode detection throughout
- Suppressed all startup log messages when in MCP mode
- Only critical errors are logged (to file, not stdout)

### 4. Updated Claude Desktop Configuration
- Added `NODE_ENV=production` to use JSON format
- Added `MCP_MODE=stdio` to explicitly enable MCP mode
- These environment variables ensure clean operation

## Testing

The server now outputs clean JSON:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  MCP_MODE=stdio NODE_ENV=production node build/index.js 2>/dev/null
```

## Log Location

Logs are now written to:
- `~/.n8n-manager/logs/n8n-manager.log`

## Next Steps

1. **Restart Claude Desktop** to load the updated configuration
2. **Check logs** if issues persist: `tail -f ~/.n8n-manager/logs/n8n-manager.log`
3. **Verify connection** in Claude Desktop - should show "n8n-manager" as connected

## Configuration Used

```json
{
  "n8n-manager": {
    "command": "node",
    "args": ["/Users/romualdczlonkowski/Pliki/n8n-manager-for-ai-agents/build/index.js"],
    "env": {
      "N8N_API_URL": "https://n8n.energyhouse.com.pl",
      "N8N_API_KEY": "your-api-key",
      "LOG_LEVEL": "info",
      "NODE_ENV": "production",
      "MCP_MODE": "stdio"
    }
  }
}
```