/**
 * @internal
 * Wire types for Organizations API communication (snake_case format)
 * These types represent the raw API request/response format
 * and should not be used directly by SDK consumers.
 */

/**
 * @internal
 * Organization type
 */
export type OrgType = 'business' | 'individual';

/**
 * @internal
 * Organization status
 */
export type OrgStatus =
  | 'awaiting_compliance_verification'
  | 'active'
  | 'suspended'
  | 'closed';

/**
 * @internal
 * Place/location for organization
 */
export interface Place {
  country_code: string;
  state: string;
  address_line1: string;
  postal_code: string;
  city: string;
  is_primary: boolean;
}

/**
 * @internal
 * Organization profile (snake_case API format)
 */
export interface OrgProfile {
  legal_name: string;
  tax_id: string;
  incorporation_date: string;
  business_type: string;
  incorporation_country_code: string;
  incorporation_state?: string;
  address_line1: string;
  address_line2?: string;
  postal_code: string;
  city: string;
  logo_url?: string;
  places?: Place[];
}

/**
 * @internal
 * Create organization request params
 */
export interface CreateOrgParams {
  org_type: OrgType;
  profile: OrgProfile;
  metadata?: Record<string, unknown>;
}

/**
 * @internal
 * Organization from API
 */
export interface Organization {
  urn: string;
  org_type: OrgType;
  profile: OrgProfile;
  metadata?: Record<string, unknown>;
  status: OrgStatus;
}

/**
 * @internal
 * Create organization response
 */
export interface CreateOrgResponse {
  result: {
    organization: Organization;
  };
  req_id: string;
}
