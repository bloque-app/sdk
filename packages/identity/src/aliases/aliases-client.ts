import { BaseClient } from '@bloque/sdk-core';

import type { Alias } from './types';

/**
 * Client for public alias lookup operations.
 *
 * Use this client to resolve a Bloque alias such as an email or phone number
 * into its public alias record.
 *
 * The `alias` query parameter is URL-encoded internally by the SDK before the
 * request is sent. Callers must pass the raw alias string and should not apply
 * `encodeURIComponent()` themselves, otherwise the alias will be double-encoded.
 */
export class AliasesClient extends BaseClient {
  /**
   * Look up a public alias by its raw alias value.
   *
   * The SDK URL-encodes the alias internally, so inputs like
   * `nestor+2@bloque.team` are handled correctly without
   * any preprocessing by the caller.
   *
   * @param alias - Raw alias value. Do not pass a pre-encoded string.
   * @returns The matching public alias record.
   *
   * @example
   * ```typescript
   * const alias = await bloque.identity.aliases.get('nestor+2@bloque.team');
   * ```
   */
  async get(alias: string): Promise<Alias> {
    const response = await this.httpClient.request<Alias>({
      method: 'GET',
      path: `/api/aliases?alias=${encodeURIComponent(alias)}`,
    });
    return response;
  }
}
