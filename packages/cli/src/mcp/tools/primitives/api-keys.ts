import { z } from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BloqueClients } from '../../types.ts';
import type { PersistedSession } from '../../../session/types.ts';

export function registerApiKeyTools(
  server: McpServer,
  clients: BloqueClients,
  session?: PersistedSession,
) {
  server.registerTool(
    'list_api_keys',
    {
      description:
        'List all API keys for the authenticated user. Returns key ID, name, scopes, status, and creation date. Secrets are never returned in list responses.',
    },
    async () => {
      const keys = await clients.identity.apiKeys.list();
      return {
        content: [{ type: 'text', text: JSON.stringify(keys, null, 2) }],
      };
    },
  );

  server.registerTool(
    'get_api_key',
    {
      description:
        'Get details of a specific API key by its ID. Returns key ID, name, scopes, status, domains, and metadata.',
      inputSchema: {
        id: z.string().describe('The API key ID'),
      },
    },
    async ({ id }) => {
      const key = await clients.identity.apiKeys.get(id);
      return {
        content: [{ type: 'text', text: JSON.stringify(key, null, 2) }],
      };
    },
  );

  server.registerTool(
    'revoke_api_key',
    {
      description:
        'Revoke an API key by its ID. This permanently disables the key. Cannot revoke the key used by this session.',
      inputSchema: {
        id: z.string().describe('The API key ID to revoke'),
      },
    },
    async ({ id }) => {
      if (session?.authType === 'apiKey' && session.apiKey) {
        const keys = await clients.identity.apiKeys.list();
        const self = keys.find((k) => k.status === 'active' && session.apiKey?.startsWith(k.keyId));
        if (self && self.id === id) {
          return {
            content: [{ type: 'text', text: 'Error: Cannot revoke the API key used by this session. This would invalidate your own authentication.' }],
            isError: true,
          };
        }
      }

      await clients.identity.apiKeys.revoke(id);
      return {
        content: [{ type: 'text', text: `API key ${id} has been revoked.` }],
      };
    },
  );

  server.registerTool(
    'rotate_api_key',
    {
      description:
        'Rotate an API key secret by its ID. Returns the new secret key (shown only once). Cannot rotate the key used by this session.',
      inputSchema: {
        id: z.string().describe('The API key ID to rotate'),
      },
    },
    async ({ id }) => {
      if (session?.authType === 'apiKey' && session.apiKey) {
        const keys = await clients.identity.apiKeys.list();
        const self = keys.find((k) => k.status === 'active' && session.apiKey?.startsWith(k.keyId));
        if (self && self.id === id) {
          return {
            content: [{ type: 'text', text: 'Error: Cannot rotate the API key used by this session. This would invalidate your own authentication.' }],
            isError: true,
          };
        }
      }

      const result = await clients.identity.apiKeys.rotate(id);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
