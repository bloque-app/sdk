import { BaseClient } from '@bloque/sdk-core';
import type { CreateOrgParams, CreateOrgResponse, Organization } from './types';

export class OrgsClient extends BaseClient {
  async create(params: CreateOrgParams): Promise<Organization> {
    const response = await this.httpClient.request<CreateOrgResponse>({
      method: 'POST',
      path: '/api/orgs',
      body: params,
    });
    return response.result.organization;
  }
}
