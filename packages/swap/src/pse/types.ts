export interface Bank {
  /**
   * Financial institution code
   */
  code: string;
  /**
   * Financial institution name
   */
  name: string;
}

export interface ListBanksResult {
  banks: Bank[];
}
