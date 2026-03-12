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

    const sdkConfig =
      session.authType === 'apiKey' && session.apiKey
        ? {
            auth: { type: 'apiKey' as const, apiKey: session.apiKey },
            mode: session.mode,
            origin: session.origin,
          }
        : {
            auth: { type: 'jwt' as const },
            mode: session.mode,
            origin: session.origin,
            tokenStorage: {
              get: () => session.accessToken,
              set: () => {},
              clear: () => {},
            },
          };

    const sdk = new SDK(sdkConfig);

    let clients: Awaited<ReturnType<typeof sdk.connect>>;
    if (session.authType === 'apiKey' && session.alias) {
      clients = await sdk.connect(session.alias);
    } else {
      clients = await sdk.authenticate();
    }

    const server = createBloqueServer(clients);

    if (opts.http) {
      await startServer(server, 'http', { port: Number(opts.port) });
    } else {
      await startServer(server, 'stdio');
    }
  });
