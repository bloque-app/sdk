import type { AccountStatus, TokenBalance } from '../types';

export interface Us2AccountDetails {
  id: string;
  userId: string;
  virtualAccountId: string;
  type: string;
  currency: string;
}

export interface Us2Account {
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
  details: Us2AccountDetails;
}

export interface CreateUs2AccountAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface CreateUs2AccountParams {
  holderUrn?: string;
  webhookUrl?: string;
  ledgerId?: string;
  metadata?: Record<string, unknown>;

  type: 'individual' | 'business';
  email: string;
  phone?: string;
  proofOfAddress?: string;
  businessFormationDocument?: string;
  taxId?: string;
  address?: CreateUs2AccountAddress;
}

export interface ListUs2AccountsParams {
  holderUrn?: string;
  urn?: string;
}

export interface ListUs2AccountsResult {
  accounts: Us2Account[];
}
