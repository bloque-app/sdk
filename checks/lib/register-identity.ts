import type { BloqueClients } from '../../packages/sdk/src/bloque';
import { createSdk } from './sdk-client';

export interface FreshIdentity {
  clients: BloqueClients;
  alias: string;
  urn: string;
}

export interface FreshIdentityOptions {
  /** ISO 3166-1 alpha-3 residence country. Defaults to `'USA'` (no country-specific policy profile). */
  countryOfResidenceCode?: string;
  countryOfBirthCode?: string;
  aliasPrefix?: string;
}

/**
 * Registers a brand-new individual identity against the configured origin,
 * so each check run starts from a known, unverified (no TOS, no KYC) state
 * instead of depending on some pre-existing sandbox user's history.
 */
export async function registerFreshIdentity(
  options: FreshIdentityOptions = {},
): Promise<FreshIdentity> {
  const bloque = createSdk();
  const alias = `${options.aliasPrefix ?? 'sdk-check'}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const emailSafeAlias = alias.replace(/[^a-z0-9]/gi, '');

  const clients = await bloque.register(alias, {
    type: 'individual',
    profile: {
      firstName: 'SDK',
      lastName: 'Check',
      email: `${emailSafeAlias}@example.com`,
      phone: '+10000000000',
      birthdate: '1990-01-01',
      city: 'Test City',
      state: 'Test State',
      postalCode: '00000',
      countryOfBirthCode: options.countryOfBirthCode ?? 'USA',
      countryOfResidenceCode: options.countryOfResidenceCode ?? 'USA',
    },
  });

  if (!clients.urn) {
    throw new Error(
      'register() succeeded but did not return a urn on the session client.',
    );
  }

  return { clients, alias, urn: clients.urn };
}
