export type AliasResponse = {
  id: string;
  alias: string;
  type: 'phone' | 'email' | string;
  urn: string;
  origin: string;
  details: {
    phone?: string;
  };
  metadata: {
    alias: string;
    [key: string]: unknown;
  };
  status: 'active' | 'inactive' | 'revoked';
  is_public: boolean;
  is_primary: boolean;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
};

interface OTPBase {
  type: 'OTP';
  params: {
    attempts_remaining: number;
  };
  value: {
    expires_at: number;
  };
}

export interface OTPAssertionEmail extends OTPBase {
  value: OTPBase['value'] & {
    email: string;
  };
}

export interface OTPAssertionWhatsApp extends OTPBase {
  value: OTPBase['value'] & {
    phone: string;
  };
}

export type OTPAssertion = OTPAssertionEmail | OTPAssertionWhatsApp;

export interface Origin {
  /**
   * Unique namespace identifier for the origin
   */
  namespace: string;
  /**
   * Provider type (e.g., 'evm', 'auth0', 'whatsapp', 'email', 'api-key')
   */
  provider: ' evm' | 'auth0' | 'whatsapp' | 'email' | 'api-key';
  /**
   * Current status of the origin
   */
  status: 'active' | 'inactive' | 'disabled';
  /**
   * Additional metadata about the origin
   */
  metadata: Record<string, unknown>;
  /**
   * Creation timestamp (ISO 8601)
   */
  created_at: string;
  /**
   * Last update timestamp (ISO 8601)
   */
  updated_at: string;
}

type SigningChallengeValue = {
  signature: string;
  alias: string;
};

type ApiKeyValue = {
  api_key: string;
  alias: string;
};

type BaseAssertion<TType extends string, TValue> = {
  alias: string;
  challengeType: TType;
  value: TValue;
  originalChallengeParams?: {
    challenge: string;
    timestamp: number;
  };
};

type ApiKeyAssertion = BaseAssertion<'API_KEY', ApiKeyValue>;

type InteractiveAssertion = BaseAssertion<
  | 'REDIRECT'
  | 'OAUTH_REDIRECT'
  | 'SIGNING_CHALLENGE'
  | 'WEBAUTHN'
  | 'OTP'
  | 'PASSWORD',
  SigningChallengeValue
>;

type AssertionResult = ApiKeyAssertion | InteractiveAssertion;

export type UserProfile = {
  first_name?: string;
  last_name?: string;
  /**
   * ISO 8601 formatted date string (YYYY-MM-DD)
   */
  birthdate?: string;
  email?: string;
  phone?: string;
  gender?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  neighborhood?: string;
  country_of_birth_code?: string;
  country_of_residence_code?: string;
  personal_id_type?: string;
  personal_id_number?: string;
};

export type BusinessProfile = {
  /**
   * Primary business address (street address)
   */
  address_line1: string;
  /**
   * City where business is registered
   */
  city: string;
  /**
   * Country of incorporation (full name)
   */
  country: string;
  /**
   * Date of incorporation or registration (YYYY-MM-DD format)
   */
  incorporation_date: string;
  /**
   * Official registered legal name of the business
   */
  legal_name: string;
  /**
   * Business trading name or DBA (Doing Business As)
   */
  name: string;
  /**
   * Postal or ZIP code
   */
  postal_code: string;
  /**
   * State, province, or region of registration
   */
  state: string;
  /**
   * Tax identification number (EIN, VAT, RFC, etc.)
   */
  tax_id: string;
  /**
   * Business legal structure type (LLC, Corporation, Partnership, etc.)
   */
  type: string;
  /**
   * Secondary address line (suite, floor, etc.)
   */
  address_line2?: string;
  /**
   * ISO country code (2 or 3 letters)
   */
  country_code?: string;
  /**
   * Business contact email
   */
  email?: string;
  /**
   * URL to business logo image
   */
  logo?: string;
  /**
   * Owner's primary address
   */
  owner_address_line1?: string;
  /**
   * Owner's secondary address line
   */
  owner_address_line2?: string;
  /**
   * Owner's city of residence
   */
  owner_city?: string;
  /**
   * Owner's country code
   */
  owner_country_code?: string;
  /**
   * Owner's identification number
   */
  owner_id_number?: string;
  /**
   * Type of identification document for owner
   */
  owner_id_type?: string;
  /**
   * Full name of the beneficial owner or primary representative
   */
  owner_name?: string;
  /**
   * Owner's postal code
   */
  owner_postal_code?: string;
  /**
   * Owner's state or province
   */
  owner_state?: string;
  /**
   * Business contact phone number
   */
  phone?: string;
};

export type IndividualRegisterRequest = {
  assertion_result: AssertionResult;
  extra_context?: Record<string, unknown>;
  type: 'individual';
  profile: UserProfile;
};

export type BusinessRegisterRequest = {
  assertion_result: AssertionResult;
  extra_context?: Record<string, unknown>;
  type: 'business';
  profile: BusinessProfile;
};

export type RegisterRequest =
  | IndividualRegisterRequest
  | BusinessRegisterRequest;

export interface RegisterResponse {
  result: {
    access_token: string;
  };
  req_id: string;
}
