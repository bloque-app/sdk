export class BloqueAPIError extends Error {
  public readonly status?: number;
  public readonly code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'BloqueAPIError';
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, BloqueAPIError.prototype);
  }
}

export class BloqueConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BloqueConfigError';
    Object.setPrototypeOf(this, BloqueConfigError.prototype);
  }
}
