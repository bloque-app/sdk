import { Command } from 'commander';
import { SDK } from '@bloque/sdk';
import { SessionStore } from '../session/store.ts';
import { createBloqueServer, startServer } from '../mcp/server.ts';

const store = new SessionStore();

export const mcpCommand = new Command('mcp')
  .description('Start the MCP server exposing Bloque SDK tools')
  .option('--http', 'Use HTTP/SSE transport instead of stdio')
  .option('--port <port>', 'HTTP port (only with --http)', '3100')
  .action(async (opts) => {
    const session = store.load();
    if (!session) {
      console.error('Not logged in. Run `bloque login` first.');
      process.exit(1);
    }

    let clients: Awaited<ReturnType<SDK['connect']>>;

    if (session.authType === 'apiKey' && session.apiKey) {
      const sdk = new SDK({
        auth: { type: 'apiKey', apiKey: session.apiKey },
        mode: session.mode,
      });
      clients = await sdk.connect();
    } else if (session.authType === 'originKey' && session.originKey && session.alias) {
      const sdk = new SDK({
        auth: { type: 'originKey', originKey: session.originKey },
        mode: session.mode,
        origin: session.origin,
      });
      clients = await sdk.connect(session.alias);
    } else {
      const sdk = new SDK({
        auth: { type: 'jwt' },
        mode: session.mode,
        origin: session.origin,
        tokenStorage: {
          get: () => session.accessToken,
          set: () => {},
          clear: () => {},
        },
      });
      clients = await sdk.authenticate();
    }

    const server = createBloqueServer(clients, session);

    if (opts.http) {
      await startServer(server, 'http', { port: Number(opts.port) });
    } else {
      await startServer(server, 'stdio');
    }
  });
