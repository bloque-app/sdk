export type Mode = 'sandbox' | 'production';

export interface BloqueConfig {
  apiKey: string;
  mode: Mode;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface BloqueResponse<T> {
  data?: T;
  error?: BloqueError;
}

export interface BloqueError {
  message: string;
  code?: string;
  status?: number;
}
