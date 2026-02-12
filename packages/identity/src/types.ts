import type {
  BusinessRegisterParams,
  IndividualRegisterParams,
} from './origins/types';

export type CreateIdentityParams =
  | Pick<IndividualRegisterParams, 'extraContext' | 'type' | 'profile'>
  | Pick<BusinessRegisterParams, 'extraContext' | 'type' | 'profile'>;

export interface IdentityMeProfile {
  city: string;
  email: string;
  phone: string;
  state: string;
  gender: string;
  birthdate: string;
  last_name: string;
  first_name: string;
  postal_code: string;
  neighborhood: string;
  address_line1: string;
  address_line2?: string;
  personal_id_type: string;
  personal_id_number: string;
  country_of_birth_code: string;
  country_of_residence_code: string;
}

export interface IdentityMe {
  urn: string;
  origin: string;
  type: string;
  profile: IdentityMeProfile;
  status: string;
  metadata: Record<string, unknown>;
}
