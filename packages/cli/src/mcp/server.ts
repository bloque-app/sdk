import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { PersistedSession } from '../session/types.ts';
import { mcpDebug } from './debug-log.ts';

import { registerAccountTools } from './tools/primitives/accounts.ts';
import { registerApiKeyTools } from './tools/primitives/api-keys.ts';
import { registerCardTools } from './tools/primitives/card.ts';
import { registerHistoryTools } from './tools/primitives/history.ts';
import { registerPolygonTools } from './tools/primitives/polygon.ts';
import { registerSwapTools } from './tools/primitives/swap.ts';
import { registerTransferTools } from './tools/primitives/transfers.ts';
import { registerUsTools } from './tools/primitives/us.ts';
import { registerVirtualTools } from './tools/primitives/virtual.ts';
import { registerAccountWorkflows } from './tools/workflows/account.ts';
import { registerCardWorkflows } from './tools/workflows/card.ts';
import { registerFundCardWorkflows } from './tools/workflows/fund-card.ts';
import { registerIdentityWorkflows } from './tools/workflows/identity.ts';
import { registerOverviewWorkflows } from './tools/workflows/overview.ts';
import { registerSpendingRulesWorkflows } from './tools/workflows/spending-rules.ts';
import { registerTopupWorkflows } from './tools/workflows/topup.ts';
import type { BloqueClients } from './types.ts';

export function createBloqueServer(
  clients: BloqueClients,
  session?: PersistedSession,
): McpServer {
  mcpDebug('createBloqueServer: registering tools');
  const server = new McpServer({ name: 'bloque', version: '0.0.1' });

  registerAccountTools(server, clients);
  registerVirtualTools(server, clients);
  registerCardTools(server, clients);
  registerPolygonTools(server, clients);
  registerUsTools(server, clients);
  registerTransferTools(server, clients);
  registerHistoryTools(server, clients);
  registerSwapTools(server, clients);
  registerApiKeyTools(server, clients, session);

  registerIdentityWorkflows(server, clients);
  registerAccountWorkflows(server, clients);
  registerCardWorkflows(server, clients);
  registerFundCardWorkflows(server, clients);
  registerTopupWorkflows(server, clients);
  registerSpendingRulesWorkflows(server, clients);
  registerOverviewWorkflows(server, clients);

  return server;
}

export async function startServer(
  server: McpServer,
  mode: 'stdio' | 'http' = 'stdio',
  options?: { port?: number },
): Promise<void> {
  if (mode === 'stdio') {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    return;
  }

  const port = options?.port ?? 3100;
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    enableJsonResponse: true,
  });

  await server.connect(transport);

  const httpServer = createServer((req, res) => {
    if (req.url === '/mcp') {
      transport.handleRequest(req, res);
    } else {
      res.writeHead(404).end('Not Found');
    }
  });

  httpServer.listen(port, () => {
    console.error(
      `Bloque MCP server listening on http://localhost:${port}/mcp`,
    );
  });
}
