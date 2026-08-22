---
"@bloque/sdk-core": minor
"@bloque/sdk-identity": minor
"@bloque/sdk-orgs": minor
"@bloque/sdk-compliance": minor
"@bloque/sdk": minor
---

Add origin-operator credentials for tenant customer-service:

- **`orgs.createOrigin(orgUrn, { namespace })`** — user JWT + KYB-active org
  with `orgs.write`. Creates an api-key origin, binds this org, seeds
  origin-cs roles, returns `originApiKey` once.
- **`orgs.assumeOrigin(namespace)`** — human user JWT in, 15-minute
  `kind: origin-operator` JWT out. Session switches so subsequent
  `apiKeys.create` mints origin-bound keys (`bound_origin` set). Org-admin
  scopes, `*.read.any`, pay/create/transfers, and passkey-as-user are not
  part of this token.
- **`apiKeys.exchange({ key, scopes?, asIdentity })`** — `{ key }` stays
  unauthenticated discovery; `{ key, asIdentity }` sends `as_identity` and
  forwards the current origin-operator Bearer. Cross-origin URNs are 404;
  unbound keys reject `asIdentity` with `400 E_AS_IDENTITY_NOT_ALLOWED`.
- **`compliance.kyc.startVerification({ urn })`** — KYC vs KYB is derived
  by the backend from the URN (`did:bloque:orgs:{id}` → KYB). Do not pass
  `type`.
