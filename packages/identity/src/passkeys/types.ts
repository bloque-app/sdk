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
}
