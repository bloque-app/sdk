export type AliasResponse = {
  id: string;
  alias: string;
  type: 'phone' | 'email' | string;
  urn: string;
  origin: string;
  details: {
    phone?: string;
  };
  metadata: {
    alias: string;
    [key: string]: unknown;
  };
  status: 'active' | 'inactive' | 'revoked';
  is_public: boolean;
  is_primary: boolean;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
};
