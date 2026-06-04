import type { ListAccountsFilterParams } from '../types';

function appendAll(
  queryParams: URLSearchParams,
  key: string,
  values: string[] | undefined,
): void {
  if (!values?.length) return;
  values.forEach((value) => {
    queryParams.append(key, value);
  });
}

export function buildAccountListQuery(
  params?: ListAccountsFilterParams,
  fixedMedium?: string,
): string {
  const queryParams = new URLSearchParams();

  const medium = fixedMedium ?? params?.medium;
  if (medium) queryParams.append('medium', medium);
  if (params?.holderUrn) queryParams.append('holder_urn', params.holderUrn);
  if (params?.urn) queryParams.append('urn', params.urn);
  appendAll(queryParams, 'urns', params?.urns);
  if (params?.q) queryParams.append('q', params.q);
  if (params?.customId) queryParams.append('custom_id', params.customId);
  if (params?.ledgerAccountId) {
    queryParams.append('ledger_account_id', params.ledgerAccountId);
  }
  appendAll(queryParams, 'ledger_account_ids', params?.ledgerAccountIds);
  if (params?.createdAfter) {
    queryParams.append('created_after', params.createdAfter);
  }
  if (params?.createdBefore) {
    queryParams.append('created_before', params.createdBefore);
  }
  if (params?.from !== undefined)
    queryParams.append('from', String(params.from));
  if (params?.to !== undefined) queryParams.append('to', String(params.to));
  if (params?.limit !== undefined)
    queryParams.append('limit', String(params.limit));
  if (params?.offset !== undefined) {
    queryParams.append('offset', String(params.offset));
  }
  if (params?.order) queryParams.append('order', params.order);

  if (params?.status) {
    const statuses = Array.isArray(params.status)
      ? params.status
      : [params.status];
    appendAll(queryParams, 'status', statuses);
  }

  if (params?.metadata) {
    Object.entries(params.metadata).forEach(([key, value]) => {
      queryParams.append(`metadata[${key}]`, value);
    });
  }

  return queryParams.toString();
}
