import http from 'node:http';
import crypto from 'node:crypto';
import { exec } from 'node:child_process';

import { SessionStore } from '../session/store.ts';
import type { PersistedSession } from '../session/types.ts';
import { startBeaconAnimation } from '../ui/beacon.ts';
import { portalAnimation } from '../ui/portal.ts';

const TIMEOUT_MS = 5 * 60 * 1000;
const MAX_PORT_RETRIES = 3;

function resolveCopilotUrl(mode: 'production' | 'sandbox'): string {
  if (process.env.BLOQUE_COPILOT_URL) {
    return process.env.BLOQUE_COPILOT_URL;
  }
  return mode === 'sandbox'
    ? 'https://copilot-dev.bloque.app'
    : 'https://copilot.bloque.app';
}

function openBrowser(url: string): void {
  const cmd = process.platform === 'darwin'
    ? `open "${url}"`
    : process.platform === 'win32'
      ? `start "" "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

function setCorsHeaders(res: http.ServerResponse, copilotUrl: string): void {
  res.setHeader('Access-Control-Allow-Origin', copilotUrl);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function listenOnRandomPort(server: http.Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject);
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to bind server'));
        return;
      }
      resolve(addr.port);
    });
  });
}

interface CallbackResult {
  token: string;
}

function startCallbackServer(
  nonce: string,
  copilotUrl: string,
): { server: http.Server; tokenPromise: Promise<CallbackResult> } {
  let resolveToken: (result: CallbackResult) => void;
  const tokenPromise = new Promise<CallbackResult>((resolve) => {
    resolveToken = resolve;
  });

  const server = http.createServer((req, res) => {
    setCorsHeaders(res, copilotUrl);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/callback') {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);

          if (data.nonce !== nonce) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'invalid_nonce', message: 'Nonce does not match' }));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));

          resolveToken({ token: data.token });
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'invalid_body' }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  return { server, tokenPromise };
}

export async function startWebAuth(mode: 'production' | 'sandbox'): Promise<PersistedSession> {
  const copilotUrl = resolveCopilotUrl(mode);
  const nonce = crypto.randomBytes(32).toString('hex');
  const { server, tokenPromise } = startCallbackServer(nonce, copilotUrl);

  let port: number | undefined;
  for (let attempt = 0; attempt < MAX_PORT_RETRIES; attempt++) {
    try {
      port = await listenOnRandomPort(server);
      break;
    } catch (err: unknown) {
      const isAddrInUse = err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'EADDRINUSE';
      if (!isAddrInUse || attempt === MAX_PORT_RETRIES - 1) {
        throw err;
      }
    }
  }

  if (port === undefined) {
    throw new Error('Failed to start local callback server');
  }

  const authUrl = `${copilotUrl}/cli/auth?port=${port}&nonce=${nonce}`;

  console.log('\n🔑 Opening browser for authorization...\n');
  console.log('   Waiting for you to authorize in the browser.');
  console.log('   If the browser didn\'t open, visit:\n');
  console.log(`   ${authUrl}\n`);

  openBrowser(authUrl);

  const stopBeacon = startBeaconAnimation();

  const cleanup = () => {
    stopBeacon();
    server.close();
  };

  const sigintHandler = () => {
    cleanup();
    process.exit(130);
  };
  process.on('SIGINT', sigintHandler);

  try {
    const result = await Promise.race([
      tokenPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS),
      ),
    ]);

    cleanup();
    process.removeListener('SIGINT', sigintHandler);

    const store = new SessionStore();
    const session: PersistedSession = {
      accessToken: result.token,
      urn: '',
      origin: copilotUrl,
      mode,
      authType: 'jwt',
      createdAt: new Date().toISOString(),
    };

    try {
      store.save(session);
    } catch {
      console.warn('\n  ⚠ Could not write credentials to ~/.bloque/session.json');
      console.warn('    Printing token so you can save it manually:\n');
      console.log(result.token);
    }

    await portalAnimation(`Authenticated via ${copilotUrl}`);

    console.log(`  Token stored in ~/.bloque/session.json`);
    console.log('  You can now use @bloque/cli commands.\n');

    return session;
  } catch (err: unknown) {
    cleanup();
    process.removeListener('SIGINT', sigintHandler);

    if (err instanceof Error && err.message === 'timeout') {
      console.error('\n✗ Authorization timed out. Please try again.\n');
      process.exit(1);
    }

    throw err;
  }
}
