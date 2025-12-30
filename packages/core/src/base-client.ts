import type { HttpClient } from './http-client';

export abstract class BaseClient {
  protected readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }
}
