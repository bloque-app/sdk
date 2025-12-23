import { API_BASE_URLS, DEFAULT_HEADERS } from './constants';
import { BloqueAPIError, BloqueConfigError } from './errors';
import type { BloqueConfig, RequestOptions, TokenStorage } from './types';

const createLocalStorageAdapter = (): TokenStorage => ({
  get: () => {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem('access_token');
  },
  set: (token: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  },
  clear: () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  },
});

export class HttpClient {
  private readonly config: BloqueConfig;
  private readonly baseUrl: string;

  private readonly publicRoutes = ['/api/aliases', '/api/origins/*/assert'];

  constructor(config: BloqueConfig) {
    this.validateConfig(config);
    this.config = config;
    this.baseUrl = API_BASE_URLS[config.mode ?? 'production'];
  }

  private isPublicRoute(path: string): boolean {
    const pathWithoutQuery = path.split('?')[0];
    return this.publicRoutes.some((route) => {
      const pattern = route.replace(/\*/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathWithoutQuery);
    });
  }

  private validateConfig(config: BloqueConfig): void {
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new BloqueConfigError('API key is required');
    }
    if (!config.mode) {
      config.mode = 'production';
    }
    if (!['sandbox', 'production'].includes(config.mode)) {
      throw new BloqueConfigError(
        'Mode must be either "sandbox" or "production"',
      );
    }
    if (config.runtime === 'client' && !config.tokenStorage) {
      config.tokenStorage = createLocalStorageAdapter();
    }
  }

  async request<T, U = unknown>(options: RequestOptions<U>): Promise<T> {
    const { method, path, body, headers = {} } = options;

    const url = `${this.baseUrl}${path}`;

    const requestHeaders: Record<string, string> = {
      ...DEFAULT_HEADERS,
      Authorization: this.config.apiKey,
      ...headers,
    };

    if (this.config.runtime === 'client' && !this.isPublicRoute(path)) {
      const token = this.config.tokenStorage?.get();
      if (!token) {
        throw new BloqueConfigError('Authentication token is missing');
      }
      requestHeaders.Authorization = `Bearer ${token}`;
    }

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
