#!/usr/bin/env node

/**
 * MCP Model Router Server
 * Main entry point for the standalone MCP server
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools/tools.js';
import { registerResources } from './resources/resources.js';

// Create MCP server
const server = new McpServer(
  {
    name: 'model-router-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Register tools and resources
registerTools(server);
registerResources(server);

process.on('SIGINT', async () => {
  console.log('\nShutting down MCP server...');
  await server.close();
  process.exit(0);
});

// Start server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Model Router Server running on stdio');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
