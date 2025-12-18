import type { HttpClient } from '@bloque/sdk-core';
import type { CreateOrgParams, CreateOrgResponse, Organization } from './types';

export class OrgsClient {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async create(params: CreateOrgParams): Promise<Organization> {
    const response = await this.httpClient.request<CreateOrgResponse>({
      method: 'POST',
      path: '/api/orgs',
      body: params,
    });
    return response.result.organization;
  }
}
