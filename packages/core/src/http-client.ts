import { API_BASE_URLS, DEFAULT_HEADERS } from './constants';
import { BloqueAPIError, BloqueConfigError } from './errors';
import type { BloqueConfig, RequestOptions } from './types';

export class HttpClient {
  private readonly config: BloqueConfig;
  private readonly baseUrl: string;

  constructor(config: BloqueConfig) {
    this.validateConfig(config);
    this.config = config;
    this.baseUrl = API_BASE_URLS[config.mode];
  }

  private validateConfig(config: BloqueConfig): void {
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new BloqueConfigError('API key is required');
    }
    if (!config.mode) {
      throw new BloqueConfigError('Mode is required');
    }
    if (!['sandbox', 'production'].includes(config.mode)) {
      throw new BloqueConfigError(
        'Mode must be either "sandbox" or "production"',
      );
    }
  }

  async request<T>(options: RequestOptions): Promise<T> {
    const { method, path, body, headers = {} } = options;

    const url = `${this.baseUrl}${path}`;

    const requestHeaders: Record<string, string> = {
      ...DEFAULT_HEADERS,
      Authorization: this.config.apiKey,
      ...headers,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorData = responseData as { message?: string; code?: string };
        throw new BloqueAPIError(
          errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code,
        );
      }

      return responseData as T;
    } catch (error) {
      if (error instanceof BloqueAPIError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new BloqueAPIError(
          `Request failed: ${error.message}`,
          undefined,
          'NETWORK_ERROR',
        );
      }

      throw new BloqueAPIError(
        'Unknown error occurred',
        undefined,
        'UNKNOWN_ERROR',
      );
    }
  }
}
