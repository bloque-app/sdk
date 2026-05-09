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
  linkToken?: string;
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
}

export interface ExchangeExternalUsBankPublicTokenParams {
  urn: string;
  publicToken: string;
}
