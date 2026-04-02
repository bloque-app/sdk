export interface PersistedSession {
  accessToken: string;
  urn: string;
  origin: string;
  mode: 'production' | 'sandbox';
  authType: 'apiKey' | 'originKey' | 'jwt';
  apiKey?: string;
  originKey?: string;
  apiUrl?: string;
  alias?: string;
  createdAt: string;
}
