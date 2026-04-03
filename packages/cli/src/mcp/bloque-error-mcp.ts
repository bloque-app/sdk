import { BloqueAPIError } from '@bloque/sdk';
import { mcpDebug } from './debug-log.ts';

type McpErrorResult = {
  content: [{ type: 'text'; text: string }];
  isError: true;
};

/**
 * Logs (when BLOQUE_MCP_DEBUG is set) and returns an MCP tool error payload.
 * For BloqueAPIError, includes the raw API body in `response` so callers
 * see the same details as in direct API responses (not only `err.message`).
 */
export function logAndFormatToolError(
  toolLabel: string,
  err: unknown,
): McpErrorResult {
  if (err instanceof BloqueAPIError) {
    mcpDebug(`${toolLabel} API error`, err.toJSON());
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              kind: 'bloque_api_error',
              name: err.name,
              message: err.message,
              status: err.status,
              code: err.code,
              requestId: err.requestId,
              response: err.response,
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }

  mcpDebug(`${toolLabel} error`, {
    name: err instanceof Error ? err.name : 'unknown',
    message: err instanceof Error ? err.message : String(err),
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            kind: 'error',
            name: err instanceof Error ? err.name : 'Error',
            message: err instanceof Error ? err.message : String(err),
          },
          null,
          2,
        ),
      },
    ],
    isError: true,
  };
}
