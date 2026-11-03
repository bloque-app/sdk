export interface CreatePasskeyLinkParams {
  /**
   * Where to send the person back once they register the passkey. Must be an
   * https URL whose origin your origin allows; otherwise the call throws
   * `BloqueReturnUrlNotAllowedError`.
   */
  returnUrl: string;
}

export interface PasskeyLink {
  /**
   * Link to Bloque's identity app (id.bloque.sh) where the person registers a
   * passkey on their own identity. It carries a short-lived token in its
   * fragment: send the person there, never log or share it.
   */
  url: string;
  /** How long the link works, as the API states it, e.g. `15m`. */
  expiresIn: string;
  /**
   * `'otp'` when the person must first enter a code Bloque sends to their
   * account's email (or phone, when it has no email) before registering the
   * passkey: the link was created with a session your origin obtained with
   * its API key. `null` when the link needs no code. The identity app asks
   * for the code itself; nothing else to do on your side.
   */
  verification: 'otp' | null;
}
