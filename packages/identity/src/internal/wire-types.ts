/**
 * @internal
 * Wire types for Identity API communication (snake_case format)
 * These types represent the raw API request/response format
 * and should not be used directly by SDK consumers.
 */

/**
 * @internal
 * Alias response from API
 */
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
  created_at: string;
  updated_at: string;
};

/**
 * @internal
 * Base OTP structure
 */
interface OTPBase {
  type: 'OTP';
  params: {
    attempts_remaining: number;
  };
  value: {
    expires_at: number;
  };
}

/**
 * @internal
 * OTP assertion for email
 */
export interface OTPAssertionEmail extends OTPBase {
  value: OTPBase['value'] & {
    email: string;
  };
}

/**
 * @internal
 * OTP assertion for WhatsApp
 */
export interface OTPAssertionWhatsApp extends OTPBase {
  value: OTPBase['value'] & {
    phone: string;
  };
}

/**
 * @internal
 * Combined OTP assertion type
 */
export type OTPAssertion = OTPAssertionEmail | OTPAssertionWhatsApp;

/**
 * @internal
 * Origin from API
 */
export interface Origin {
  namespace: string;
  provider: ' evm' | 'auth0' | 'whatsapp' | 'email' | 'api-key';
  status: 'active' | 'inactive' | 'disabled';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * @internal
 * Signing challenge value
 */
type SigningChallengeValue = {
  signature: string;
  alias: string;
};

/**
 * @internal
 * API key value
 */
type ApiKeyValue = {
  api_key: string;
  alias: string;
};

/**
 * @internal
 * Base assertion structure
 */
type BaseAssertion<TType extends string, TValue> = {
  alias: string;
  challengeType: TType;
  value: TValue;
  originalChallengeParams?: {
    challenge: string;
    timestamp: number;
  };
};

/**
 * @internal
 * API key assertion
 */
type ApiKeyAssertion = BaseAssertion<'API_KEY', ApiKeyValue>;

/**
 * @internal
 * Interactive assertion (signing, oauth, webauthn, etc.)
 */
type InteractiveAssertion = BaseAssertion<
  | 'REDIRECT'
  | 'OAUTH_REDIRECT'
  | 'SIGNING_CHALLENGE'
  | 'WEBAUTHN'
  | 'OTP'
  | 'PASSWORD',
  SigningChallengeValue
>;

/**
 * @internal
 * Combined assertion result type
 */
export type AssertionResult = ApiKeyAssertion | InteractiveAssertion;

/**
 * @internal
 * User profile for registration (snake_case API format)
 */
export type UserProfile = {
  first_name?: string;
  last_name?: string;
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

/**
 * @internal
 * Business profile for registration (snake_case API format)
 */
export type BusinessProfile = {
  address_line1: string;
  city: string;
  country: string;
  incorporation_date: string;
  legal_name: string;
  name: string;
  postal_code: string;
  state: string;
  tax_id: string;
  type: string;
  address_line2?: string;
  country_code?: string;
  email?: string;
  logo?: string;
  owner_address_line1?: string;
  owner_address_line2?: string;
  owner_city?: string;
  owner_country_code?: string;
  owner_id_number?: string;
  owner_id_type?: string;
  owner_name?: string;
  owner_postal_code?: string;
  owner_state?: string;
  phone?: string;
};

/**
 * @internal
 * Individual registration request
 */
export type IndividualRegisterRequest = {
  assertion_result: AssertionResult;
  extra_context?: Record<string, unknown>;
  type: 'individual';
  profile: UserProfile;
};

/**
 * @internal
 * Business registration request
 */
export type BusinessRegisterRequest = {
  assertion_result: AssertionResult;
  extra_context?: Record<string, unknown>;
  type: 'business';
  profile: BusinessProfile;
};

/**
 * @internal
 * Combined registration request type
 */
export type RegisterRequest =
  | IndividualRegisterRequest
  | BusinessRegisterRequest;

/**
 * @internal
 * Registration response from API
 */
export interface RegisterResponse {
  result: {
    access_token: string;
  };
  req_id: string;
}
