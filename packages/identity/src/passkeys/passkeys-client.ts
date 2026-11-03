import { BaseClient } from '@bloque/sdk-core';
import type { CreatePasskeyLinkParams, PasskeyLink } from './types';

interface CreatePasskeyLinkResponse {
  token: string;
  url: string;
  expires_in: string;
  verification?: 'otp' | null;
}

export class PasskeysClient extends BaseClient {
  /**
   * Create a link where the signed-in person registers a passkey again (for
   * example after losing their device), then comes back to `returnUrl`.
   *
   * Needs a user session for the person: their own (browser or React Native
   * JWT), or one your backend obtained with your origin's API key. With the
   * latter, while Bloque requires it, the link comes back with
   * `verification: 'otp'`: the identity app first sends the person a code to
   * their email (or phone) and they enter it before registering. An API key
   * token itself cannot create the link.
   *
   * @throws {BloqueReturnUrlNotAllowedError} `returnUrl` is not allowed for your origin.
   * @throws {BloquePasskeyRegistrationUnavailableError} The deployment does not
   * register passkeys (`retryable: false`) or cannot right now (`retryable: true`).
   * @throws {BloqueRateLimitError} Too many links for this session.
   *
   * @example
   * ```typescript
   * const { url } = await bloque.identity.passkeys.createLink({
   *   returnUrl: 'https://myapp.com/settings/security',
   * });
   * window.location.assign(url);
   * ```
   */
  async createLink(params: CreatePasskeyLinkParams): Promise<PasskeyLink> {
    const response = await this.httpClient.request<CreatePasskeyLinkResponse>({
      method: 'POST',
      path: '/api/origins/passkeys/links',
      body: { return_url: params.returnUrl },
    });

    return {
      url: response.url,
      expiresIn: response.expires_in,
      verification: response.verification ?? null,
    };
  }
}
