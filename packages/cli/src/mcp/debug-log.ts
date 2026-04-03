/**
 * Debug logging for MCP stdio mode: always use stderr so JSON-RPC on stdout stays valid.
 * Set BLOQUE_MCP_DEBUG=1 (or true) in the MCP server environment (e.g. Cursor MCP config).
 *
 * Use this to verify whether a tool handler ran and to capture full BloqueAPIError
 * payloads (status, code, requestId, response) when debugging API failures.
 */
export function mcpDebug(message: string, data?: unknown): void {
  const enabled =
    process.env.BLOQUE_MCP_DEBUG === '1' ||
    process.env.BLOQUE_MCP_DEBUG === 'true';
  if (!enabled) return;

  const payload =
    data === undefined
      ? ''
      : ` ${JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? String(v) : v))}`;
  console.error(`[bloque-mcp] ${message}${payload}`);
}
