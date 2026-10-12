---
"@bloque/sdk-compliance": minor
"@bloque/sdk": minor
---

The TOS gate's passkey step now speaks both backends. `tosGate.challenge()`
returns a `passkey` discriminated by `scheme`: `kreivo` (the legacy shape,
unchanged on the wire: `context`, `expiresAtBlock`, `publicAddress`, ...) or
`aledgent` (`challenge`, `expiresAt`, `rpId`, `userId`, `userName`). The
backend picks the scheme per deployment; answer `accept()` in the same one.

`accept()`'s `passkey` takes either a Kreivo registration (the existing parts;
`scheme` optional, so current code keeps compiling and sends the same body)
or `{ scheme: 'aledgent', clientDataJson, attestationObject }`, sent as
`{ client_data_json, attestation_object }` for aledgent ingress to verify.
On aledgent, `accept()` returns `passkeyRegistered`.

New browser helpers, also exported from `@bloque/sdk`:
`buildTosGatePasskeyCreationOptions(challenge)` builds the
`navigator.credentials.create()` options the hosted page uses, and
`toTosGatePasskeyRegistration(credential, challenge)` turns the resulting
`PublicKeyCredential` into `accept()`'s `passkey` in the challenge's scheme
(`toAledgentPasskeyRegistration` / `toKreivoPasskeyRegistration` for one
scheme each).

Type note: code that reads Kreivo-only fields (`context`, `expiresAtBlock`,
`publicAddress`) off `challenge()`'s `passkey` must now narrow on
`passkey.scheme === 'kreivo'` first. Runtime behaviour against the legacy
backend is unchanged.
