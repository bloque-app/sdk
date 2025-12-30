import { API_BASE_URLS, DEFAULT_HEADERS } from './constants';
import { BloqueAPIError, BloqueConfigError } from './errors';
import type { BloqueConfig, RequestOptions, TokenStorage } from './types';

const isFrontendPlatform = (platform?: string) =>
  platform === 'browser' || platform === 'react-native';

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
  readonly config: BloqueConfig;
  private readonly baseUrl: string;

  private readonly publicRoutes = [
    '/api/aliases',
    '/api/origins/*/assert',
    '/api/origins',
  ];

  constructor(config: BloqueConfig) {
    this.validateConfig(config);
    this.config = config;
    this.baseUrl = API_BASE_URLS[config.mode ?? 'production'];
  }

  private validateConfig(config: BloqueConfig): void {
    config.mode ??= 'production';
    config.platform ??= 'node';

    if (!['sandbox', 'production'].includes(config.mode)) {
      throw new BloqueConfigError(
        'Mode must be either "sandbox" or "production"',
      );
    }

    if (config.auth.type === 'apiKey') {
      if (!config.auth.apiKey?.trim()) {
        throw new BloqueConfigError(
          'API key is required for apiKey authentication',
        );
      }

      if (isFrontendPlatform(config.platform)) {
        throw new BloqueConfigError(
          'API key authentication is not allowed in frontend platforms',
        );
      }
    }

    if (config.auth.type === 'jwt') {
      if (!config.tokenStorage) {
        if (config.platform === 'browser') {
          config.tokenStorage = createLocalStorageAdapter();
        } else {
          throw new BloqueConfigError(
            'tokenStorage must be provided when using JWT authentication',
          );
        }
      }
    }
  }

  private isPublicRoute(path: string): boolean {
    const pathWithoutQuery = path.split('?')[0];
    return this.publicRoutes.some((route) => {
      const pattern = route.replace(/\*/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathWithoutQuery);
    });
  }

  private buildAuthHeaders(path: string): Record<string, string> {
    if (this.isPublicRoute(path)) {
      return {};
    }

    if (this.config.auth.type === 'apiKey') {
      if (this.config.accessToken) {
        return {
          Authorization: `Bearer ${this.config.accessToken}`,
        };
      }
      return {
        Authorization: this.config.auth.apiKey,
      };
    }

    if (this.config.auth.type === 'jwt') {
      const token = this.config.tokenStorage?.get();
      if (!token) {
        throw new BloqueConfigError('Authentication token is missing');
      }

      return {
        Authorization: `Bearer ${token}`,
      };
    }

    return {};
  }

  async request<T, U = unknown>(options: RequestOptions<U>): Promise<T> {
    const { method, path, body, headers = {} } = options;

    const url = `${this.baseUrl}${path}`;

    const requestHeaders: Record<string, string> = {
      ...DEFAULT_HEADERS,
      ...this.buildAuthHeaders(path),
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
