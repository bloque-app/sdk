export interface SigningChallengeValue {
  /**
   * The cryptographic signature
   */
  signature: string;
  /**
   * The alias being verified
   */
  alias: string;
}

export interface ApiKeyValue {
  /**
   * API key for authentication
   */
  apiKey: string;
  /**
   * The alias being verified
   */
  alias: string;
}

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

interface UserProfile {
  firstName?: string;
  lastName?: string;
  /**
   * ISO 8601 formatted date string (YYYY-MM-DD)
   */
  birthdate?: string;
  email?: string;
  phone?: string;
  gender?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  neighborhood?: string;
  countryOfBirthCode?: string;
  countryOfResidenceCode?: string;
  personalIdType?: string;
  personalIdNumber?: string;
}

interface BusinessProfile {
  /**
   * Primary business address (street address)
   */
  addressLine1: string;
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
  incorporationDate: string;
  /**
   * Official registered legal name of the business
   */
  legalName: string;
  /**
   * Business trading name or DBA (Doing Business As)
   */
  name: string;
  /**
   * Postal or ZIP code
   */
  postalCode: string;
  /**
   * State, province, or region of registration
   */
  state: string;
  /**
   * Tax identification number (EIN, VAT, RFC, etc.)
   */
  taxId: string;
  /**
   * Business legal structure type (LLC, Corporation, Partnership, etc.)
   */
  type: string;
  /**
   * Secondary address line (suite, floor, etc.)
   */
  addressLine2?: string;
  /**
   * ISO country code (2 or 3 letters)
   */
  countryCode?: string;
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
  ownerAddressLine1?: string;
  /**
   * Owner's secondary address line
   */
  ownerAddressLine2?: string;
  /**
   * Owner's city of residence
   */
  ownerCity?: string;
  /**
   * Owner's country code
   */
  ownerCountryCode?: string;
  /**
   * Owner's identification number
   */
  ownerIdNumber?: string;
  /**
   * Type of identification document for owner
   */
  ownerIdType?: string;
  /**
   * Full name of the beneficial owner or primary representative
   */
  ownerName?: string;
  /**
   * Owner's postal code
   */
  ownerPostalCode?: string;
  /**
   * Owner's state or province
   */
  ownerState?: string;
  /**
   * Business contact phone number
   */
  phone?: string;
}

export interface IndividualRegisterParams {
  /**
   * Result of the assertion challenge
   */
  assertionResult: AssertionResult;
  /**
   * Additional context data
   */
  extraContext?: Record<string, unknown>;
  /**
   * Type of entity being registered
   */
  type: 'individual';
  /**
   * User profile information
   */
  profile: UserProfile;
}

export interface BusinessRegisterParams {
  /**
   * Result of the assertion challenge
   */
  assertionResult: AssertionResult;
  /**
   * Additional context data
   */
  extraContext?: Record<string, unknown>;
  /**
   * Type of entity being registered
   */
  type: 'business';
  /**
   * Business profile information
   */
  profile: BusinessProfile;
}

export type RegisterParams = IndividualRegisterParams | BusinessRegisterParams;

export interface RegisterResult {
  /**
   * JWT access token for the registered identity
   */
  accessToken: string;
}
