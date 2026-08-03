export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `Missing required env var ${name}. Copy checks/.env.example to the repo root's .env and fill it in — see checks/README.md.`,
    );
  }
  return value;
}
