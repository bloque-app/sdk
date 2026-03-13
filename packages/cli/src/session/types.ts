export interface PersistedSession {
  accessToken: string;
  urn: string;
  origin: string;
  mode: 'production' | 'sandbox';
  authType: 'apiKey' | 'jwt';
  apiKey?: string;
  alias?: string;
  createdAt: string;
}
