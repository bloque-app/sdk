interface Account<TDetails = unknown> {
  id: string;
  urn: string;
  medium: 'bancolombia' | 'card';
  details: TDetails;
  status:
    | 'active'
    | 'disabled'
    | 'frozen'
    | 'deleted'
    | 'creation_in_progress'
    | 'creation_failed';
  owner_urn: string;
  created_at: string;
  updated_at: string;
  webhook_url: string | null;
  metadata?: Record<string, unknown>;
}

export type CardType = 'VIRTUAL' | 'PHYSICAL';

export interface CreateAccountRequest<TInput = unknown> {
  holder_urn: string;
  input: TInput;
  metadata?: Record<string, unknown>;
  webhook_url?: string;
}

export type CreateCardAccountInput = {
  create: {
    card_type: CardType;
  };
};

export interface CreateAccountResponse<TDetails = unknown> {
  result: {
    account: Account<TDetails>;
  };
  req_id: string;
}

export type CardDetails = {
  id: string;
  email: string;
  operational_country: 'COL';
  client_id: string;
  card_id: string;
  card_last_four: string;
  card_provider: 'VISA';
  card_product_type: 'CREDIT';
  card_status: 'ACTIVE';
  card_url_details: string;
  card_type: CardType;
  user_id: string;
};
