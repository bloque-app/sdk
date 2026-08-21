---
"@bloque/sdk-core": minor
"@bloque/sdk-identity": minor
"@bloque/sdk-orgs": minor
"@bloque/sdk": minor
---

Add origin-operator credentials for tenant customer-service:

- **`orgs.assumeOrigin(namespace)`** — human user JWT in, 15-minute
  `kind: origin-operator` JWT out. Session switches so subsequent
  `apiKeys.create` mints origin-bound keys (`bound_origin` set). Org-admin
  scopes, `*.read.any`, pay/create/transfers, and passkey-as-user are not
  part of this token.
- **`apiKeys.exchange({ key, scopes?, asIdentity })`** — `{ key }` stays
  unauthenticated discovery; `{ key, asIdentity }` sends `as_identity` and
  forwards the current origin-operator Bearer. Cross-origin URNs are 404;
  unbound keys reject `asIdentity` with `400 E_AS_IDENTITY_NOT_ALLOWED`.
