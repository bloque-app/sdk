import type { HttpClient } from '@bloque/sdk-core';
import { BaseClient } from '@bloque/sdk-core';
import type {
  BusinessProfile,
  Origin,
  OTPAssertion,
  OTPAssertionEmail,
  OTPAssertionWhatsApp,
  RegisterRequest,
  RegisterResponse,
  UserProfile,
} from '../internal/wire-types';
import { OriginClient } from './origin-client';
import type {
  BusinessRegisterParams,
  IndividualRegisterParams,
  RegisterParams,
  RegisterResult,
} from './types';

export class OriginsClient extends BaseClient {
  public readonly whatsapp: OriginClient<OTPAssertionWhatsApp>;
  public readonly email: OriginClient<OTPAssertionEmail>;

  constructor(httpClient: HttpClient) {
    super(httpClient);

    this.whatsapp = new OriginClient(httpClient, 'bloque-whatsapp');
    this.email = new OriginClient(httpClient, 'bloque-email');
  }

  custom(origin: string): OriginClient<OTPAssertion> {
    return new OriginClient(this.httpClient, origin);
  }

  /**
   * List all available origins
   *
   * Retrieves a list of all registered origins with their current status.
   * Origins are the entry points for user identities and represent organizations,
   * startups, chains, or any entity that can hold a set of identities.
   *
   * @returns Promise resolving to an array of origins
   *
   * @example
   * ```typescript
   * const origins = await bloque.identity.origins.list();
   *
   * // Filter active origins
   * const activeOrigins = origins.filter(o => o.status === 'active');
   *
   * // Find specific provider origins
   * const evmOrigins = origins.filter(o => o.provider === 'evm');
   * ```
   */
  async list(): Promise<Origin[]> {
    const response = await this.httpClient.request<Origin[]>({
      method: 'GET',
      path: '/api/origins',
    });

    return response;
  }

  /**
   * Register a new user or business identity to a specific origin
   *
   * Creates a new identity by verifying the assertion result (challenge response)
   * and storing the profile information. Supports both individual users (KYC) and
   * businesses (KYB) registration.
   *
   * Different origins support different challenge types:
   * - **SIGNING_CHALLENGE**: Blockchain signature verification (e.g., Ethereum, Solana)
   * - **API_KEY**: Traditional API key authentication
   * - **OAUTH_REDIRECT**: OAuth-based authentication flows
   * - **WEBAUTHN**: WebAuthn/passkey authentication
   * - **OTP**: One-time password verification
   * - **PASSWORD**: Password-based authentication
   *
   * @param origin - The origin namespace to register the identity to (e.g., 'ethereum-mainnet', 'bloque-api')
   * @param params - Registration data including assertion result and profile information
   * @returns Promise resolving to the registration result with access token
   *
   * @example
   * ```typescript
   * // Register individual user with blockchain signature (KYC)
   * const individual = await bloque.identity.origins.register('ethereum-mainnet', {
   *   assertionResult: {
   *     alias: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
   *     challengeType: 'SIGNING_CHALLENGE',
   *     value: {
   *       signature: '0x1234567890abcdef...',
   *       alias: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
   *     },
   *     originalChallengeParams: {
   *       challenge: 'bloque-challenge-1234567890',
   *       timestamp: 1640995200
   *     }
   *   },
   *   type: 'individual',
   *   profile: {
   *     firstName: 'John',
   *     lastName: 'Doe',
   *     email: 'john.doe@example.com',
   *     phone: '+1234567890',
   *     birthdate: '1990-01-15',
   *     city: 'New York',
   *     state: 'NY',
   *     postalCode: '10001',
   *     countryOfBirthCode: 'USA',
   *     countryOfResidenceCode: 'USA'
   *   }
   * });
   *
   * // Register business with API key (KYB)
   * const business = await bloque.identity.origins.register('bloque-api', {
   *   assertionResult: {
   *     alias: 'business-123',
   *     challengeType: 'API_KEY',
   *     value: {
   *       apiKey: 'sk_live_abc123def456',
   *       alias: 'business-123'
   *     }
   *   },
   *   type: 'business',
   *   profile: {
   *     legalName: 'Acme Corporation',
   *     name: 'Acme Corp',
   *     taxId: '12-3456789',
   *     type: 'LLC',
   *     incorporationDate: '2020-01-15',
   *     addressLine1: '123 Business St',
   *     city: 'New York',
   *     state: 'NY',
   *     postalCode: '10001',
   *     country: 'United States',
   *     email: 'contact@acme.com',
   *     phone: '+1-555-0123',
   *     ownerName: 'Jane Smith',
   *     ownerIdType: 'SSN',
   *     ownerIdNumber: '123-45-6789'
   *   }
   * });
   *
   * // Access tokens for authenticated sessions
   * console.log(individual.accessToken); // JWT token for individual
   * console.log(business.accessToken); // JWT token for business
   * ```
   */
  async register(
    alias: string,
    origin: string,
    params: RegisterParams,
  ): Promise<RegisterResult> {
    const assertionResult = params.assertionResult;

    const assertion_result =
      assertionResult.challengeType === 'API_KEY'
        ? {
            alias: assertionResult.alias,
            challengeType: 'API_KEY' as const,
            value: {
              api_key: assertionResult.value.apiKey,
              alias: alias,
            },
            originalChallengeParams: assertionResult.originalChallengeParams,
          }
        : {
            alias: alias,
            challengeType: assertionResult.challengeType,
            value: assertionResult.value,
            originalChallengeParams: assertionResult.originalChallengeParams,
          };

    let request: RegisterRequest;

    if (params.type === 'individual') {
      request = {
        assertion_result,
        extra_context: params.extraContext,
        type: 'individual',
        profile: this._mapUserProfile(params.profile),
      };
    } else {
      request = {
        assertion_result,
        extra_context: params.extraContext,
        type: 'business',
        profile: this._mapBusinessProfile(params.profile),
      };
    }

    const response = await this.httpClient.request<
      RegisterResponse,
      RegisterRequest
    >({
      method: 'POST',
      path: `/api/origins/${origin}/register`,
      body: request,
    });

    return {
      accessToken: response.result.access_token,
    };
  }

  private _mapUserProfile(
    profile: IndividualRegisterParams['profile'],
  ): UserProfile {
    return {
      first_name: profile.firstName,
      last_name: profile.lastName,
      birthdate: profile.birthdate,
      email: profile.email,
      phone: profile.phone,
      gender: profile.gender,
      address_line1: profile.addressLine1,
      address_line2: profile.addressLine2,
      city: profile.city,
      state: profile.state,
      postal_code: profile.postalCode,
      neighborhood: profile.neighborhood,
      country_of_birth_code: profile.countryOfBirthCode,
      country_of_residence_code: profile.countryOfResidenceCode,
      personal_id_type: profile.personalIdType,
      personal_id_number: profile.personalIdNumber,
    };
  }

  private _mapBusinessProfile(
    profile: BusinessRegisterParams['profile'],
  ): BusinessProfile {
    return {
      address_line1: profile.addressLine1,
      city: profile.city,
      country: profile.country,
      incorporation_date: profile.incorporationDate,
      legal_name: profile.legalName,
      name: profile.name,
      postal_code: profile.postalCode,
      state: profile.state,
      tax_id: profile.taxId,
      type: profile.type,
      address_line2: profile.addressLine2,
      country_code: profile.countryCode,
      email: profile.email,
      logo: profile.logo,
      owner_address_line1: profile.ownerAddressLine1,
      owner_address_line2: profile.ownerAddressLine2,
      owner_city: profile.ownerCity,
      owner_country_code: profile.ownerCountryCode,
      owner_id_number: profile.ownerIdNumber,
      owner_id_type: profile.ownerIdType,
      owner_name: profile.ownerName,
      owner_postal_code: profile.ownerPostalCode,
      owner_state: profile.ownerState,
      phone: profile.phone,
    };
  }
}
