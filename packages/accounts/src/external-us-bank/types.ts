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

/**
 * Parameters for {@link ExternalUsBankClient.pull}.
 *
 * Initiates a Brale ACH debit from the user's linked bank and swaps the
 * proceeds to DUSD on Kusama, teleporting them to the caller's Kreivo ledger
 * account associated with the linked-bank account URN.
 */
export interface PullExternalUsBankParams {
  /**
   * URN of the linked external US bank account to debit.
   *
   * Must be on the `external-us-bank` medium and owned by the authenticated
   * caller. The bank must be in `linkStatus === 'active'` (Plaid Link
   * finished and `public_token` exchanged).
   *
   * @example "did:bloque:account:external-us-bank:abc-123"
   */
  urn: string;

  /**
   * USD amount to pull from the linked bank, as a decimal string.
   *
   * Always pass as a string to avoid floating-point precision loss
   * (e.g. `"100.00"`, `"250.50"`). Must be positive.
   *
   * @example "100.00"
   */
  amount: string;

  /**
   * Optional caller-supplied idempotency hint. Currently informational
   * (server-side idempotency is keyed on the swap signature).
   */
  idempotencyKey?: string;
}

/**
 * Snapshot of the swap order created by {@link ExternalUsBankClient.pull}.
 *
 * Use `orderSig` to correlate webhooks (`swap.order.*`) and to fetch the
 * order from `@bloque/sdk-swap` if you need to poll for status.
 */
export interface PullExternalUsBankResult {
  /** Signature of the swap order. Stable identifier for webhook correlation. */
  orderSig?: string;
  /** Instruction graph identifier executing the swap. */
  graphId?: string;
  /** Initial status of the swap order (e.g. `"pending"`, `"running"`). */
  status?: string;
  /**
   * Raw execution payload from the swap service. Shape mirrors the
   * `swap.take` response and may evolve — treat as opaque unless you
   * specifically need to introspect the first auto-executed node.
   */
  execution?: unknown;
  /** Request id assigned by the mediums service (useful for support). */
  requestId?: string;
}
