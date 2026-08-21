import type {
  BusinessRegisterParams,
  IndividualRegisterParams,
} from './origins/types';

export type CreateIdentityParams =
  | Pick<
      IndividualRegisterParams,
      'extraContext' | 'type' | 'profile' | 'clientIp'
    >
  | Pick<
      BusinessRegisterParams,
      'extraContext' | 'type' | 'profile' | 'clientIp'
    >;

/**
 * Parameters for updating the current user's identity
 */
export interface UpdateIdentityParams {
  /** Partial profile fields to update (merged with existing). Shape
   * depends on the identity's `type` — see {@link IdentityMe.profile}. */
  profile?:
    | Partial<IdentityMeProfile>
    | Partial<IdentityMeBusinessProfile>
    | Record<string, unknown>;
  /** Partial metadata to update (merged with existing) */
  metadata?: Record<string, unknown>;
}

/**
 * Alias information
 */
export interface IdentityAlias {
  alias: string;
  type: string;
  verified: boolean;
  primary: boolean;
}

/**
 * Shape of `IdentityMe.profile` when `type === 'individual'`. Other
 * identity types (`business`, `dao`, `proxy`, `other`) have a differently
 * shaped profile — see {@link IdentityMe.profile}.
 */
export interface IdentityMeProfile {
  city?: string;
  email?: string;
  phone?: string;
  state?: string;
  gender?: string;
  birthdate?: string;
  last_name?: string;
  first_name?: string;
  postal_code?: string;
  neighborhood?: string;
  address_line1?: string;
  address_line2?: string;
  personal_id_type?: string;
  personal_id_number?: string;
  country_of_birth_code?: string;
  country_of_residence_code?: string;
}

/**
 * Shape of `IdentityMe.profile` when `type === 'business'`.
 */
export interface IdentityMeBusinessProfile {
  legal_name?: string;
  tax_id?: string;
  owner_name?: string;
  owner_id_type?: string;
  owner_id_number?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country_code?: string;
  phone?: string;
  email?: string;
}

export interface IdentityMe {
  urn: string;
  origin: string;
  /** `'individual'`, `'business'`, `'dao'`, `'proxy'`, or `'other'`. Check
   * this before reading `profile` — its shape depends on this value. */
  type: string;
  /**
   * Shaped per `type`: {@link IdentityMeProfile} for `'individual'`,
   * {@link IdentityMeBusinessProfile} for `'business'`. `'dao'`/`'proxy'`/
   * `'other'` identities carry an unstructured profile — treat it as
   * `Record<string, unknown>` for those.
   */
  profile:
    | IdentityMeProfile
    | IdentityMeBusinessProfile
    | Record<string, unknown>;
  status: string;
  metadata: Record<string, unknown>;
}
