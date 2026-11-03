---
"@bloque/sdk-identity": minor
"@bloque/sdk": minor
---

`identity.passkeys.createLink()` returns `verification` (`'otp' | null`): `'otp'` when the link was created with a session obtained with the origin's API key, so the identity portal asks the person for a code sent to their email or phone before registering the passkey.
