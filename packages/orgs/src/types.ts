export type OrgType = 'business' | 'individual';

export type OrgStatus = 'awaiting_compliance_verification' | 'active' | 'suspended' | 'closed';

export interface Place {
  country_code: string;
  state: string;
  address_line1: string;
  postal_code: string;
  city: string;
  is_primary: boolean;
}

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

export interface CreateOrgParams {
  org_type: OrgType;
  profile: OrgProfile;
  metadata?: Record<string, unknown>;
}

export interface Organization {
  urn: string;
  org_type: OrgType;
  profile: OrgProfile;
  metadata?: Record<string, unknown>;
  status: OrgStatus;
}

export interface CreateOrgResponse {
  result: {
    organization: Organization;
  };
  req_id: string;
}
