/**
 * Identifies this SDK on every outgoing request (see `DEFAULT_HEADERS` in
 * `constants.ts`) so the backend can tell an official-SDK caller apart from
 * a direct API call, and which SDK/version made it — used for the account
 * deletion audit trail, and available for any future use.
 *
 * `@bloque/sdk-core`, `@bloque/sdk-accounts`, `@bloque/sdk`, and every other
 * package in this monorepo are version-locked together (see the `fixed`
 * group in `.changeset/config.json`), so a single version here accurately
 * identifies all of them. Keep in sync with `packages/sdk/package.json`'s
 * `version` field.
 */
export const SDK_NAME = '@bloque/sdk';
export const SDK_VERSION = '0.11.1';
