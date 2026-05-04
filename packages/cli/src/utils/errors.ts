export class CliError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliError';
    Object.setPrototypeOf(this, CliError.prototype);
  }
}
