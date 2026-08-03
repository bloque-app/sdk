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

/**
 * Self-serviceable presentation metadata for an API-key origin. This is the
 * complete allowlist accepted by `OriginsClient.updateMetadata()` — any other
 * field on `Origin.metadata` (e.g. `contactEmail`) is owned by other systems
 * and can't be set through this surface.
 */
export interface OriginMetadataPatch {
  /**
   * Developer-facing display name substituted as `{{developer_name}}` into
   * the hosted TOS document. Non-empty, at most 200 characters.
   */
  company?: string;
  /** Skip the hosted TOS gate's intro screens. */
  tosGateShowHome?: boolean;
  /**
   * Brand accent color applied to both hosted gates' `--accent` CSS
   * variable. Strict 3- or 6-digit CSS hex (e.g. `#f80` or `#ff8800`) —
   * anything else is silently dropped server-side, never partially applied.
   */
  gateAccentColor?: string;
  /**
   * Bare origins (scheme + host + port, no path or trailing slash) allowed
   * as `returnUrl` on `compliance.verificationGate.start()`, in addition to
   * the deployment-wide `VERIFICATION_GATE_RETURN_URL_ALLOWLIST` env var —
   * either being satisfied is enough. Replaces the whole array; it does not
   * append to whatever is already configured.
   */
  verificationGateReturnUrlAllowlist?: string[];
}

export interface UpdateOriginMetadataParams {
  /**
   * Origin namespace to patch — the same value passed as `origin` to
   * `new SDK(...)`.
   */
  originName: string;
  /**
   * The origin's own provisioned secret key (`sk_live_...`/`sk_test_...`),
   * verified server-side against `origin_key_values` — not a
   * dashboard-issued API key.
   */
  apiKey: string;
  /**
   * Shallow-merged into the origin's existing metadata: fields you omit are
   * left untouched.
   */
  metadata: OriginMetadataPatch;
}

export interface UpdateOriginMetadataResult {
  /** Origin namespace that was updated. */
  originName: string;
  /** The origin's full metadata after the patch was merged in. */
  metadata: Record<string, unknown>;
  updated: true;
}
