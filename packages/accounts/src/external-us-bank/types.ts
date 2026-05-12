import type { AccountStatus, TokenBalance } from '../types';

export type ExternalUsBankLinkStatus =
  | 'pending_link'
  | 'active'
  | 'link_failed'
  | 'closed';

export interface ExternalUsBankAccountDetails {
  id: string;
  linkStatus: ExternalUsBankLinkStatus;
  braleAccountId?: string;
  braleAddressId?: string;
  /**
   * Short-lived Plaid `link_token`. Embed Plaid Link with this token to drive
   * the browser-side flow yourself, or open `linkUrl` to use the Bloque-hosted
   * page instead.
   */
  linkToken?: string;
  /** ISO 8601 expiration of `linkToken`, as reported by Brale. */
  linkTokenExpiration?: string;
  /**
   * Fully-qualified URL of the Bloque-hosted Plaid Link page for this pending
   * account. Open it in a browser (or redirect the user to it) to complete
   * linking without embedding Plaid Link yourself. Carries a short-lived
   * `plaid-link` JWT bound to this account URN; only present when the server
   * issued one (typically when `returnUrl` was supplied at create time).
   */
  linkUrl?: string;
  /**
   * Short-lived JWT for the hosted Plaid Link page, when the server returns it
   * alongside `linkUrl` (same TTL as the link session).
   */
  jwt?: string;
  bankAccountLast4?: string;
  bankName?: string;
  failureReason?: string;
}

export interface ExternalUsBankAccount {
  urn: string;
  id: string;
  status: AccountStatus;
  ownerUrn: string;
  ledgerId: string;
  webhookUrl: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  balance: Record<string, TokenBalance>;
  details: ExternalUsBankAccountDetails;
}

export interface CreateExternalUsBankAccountParams {
  holderUrn?: string;
  webhookUrl?: string;
  ledgerId?: string;
  metadata?: Record<string, unknown>;
  label?: string;
  /**
   * URL the user is redirected to after the hosted Plaid Link page finishes.
   * Origin must be allowlisted by the server (`PLAID_LINK_RETURN_URL_ALLOWLIST`).
   *
   * Supplying this opts into the hosted-page flow: the response's
   * `details.linkUrl` becomes the destination to open, and the server mints
   * a short-lived `plaid-link` JWT bound to the returned account URN.
   *
   * @example "https://app.example.com/wallet/plaid-return"
   */
  returnUrl?: string;
  /**
   * Opaque correlator forwarded back through `returnUrl` as `state`
   * (max 256 characters). Use it to resume your UI flow after the hosted page
   * redirects the user.
   *
   * @example "user-session-xyz"
   */
  state?: string;
}

export interface ExchangeExternalUsBankPublicTokenParams {
  urn: string;
  publicToken: string;
}
