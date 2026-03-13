#!/usr/bin/env bun
/**
 * Publishes the current package only if this version isn't already on npm.
 * Designed to be called from each package's "release" script so that
 * `bun run -r --parallel --filter='./packages/*' release` is idempotent.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();
const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf-8'));
const { name, version } = pkg;

try {
  const existing = execSync(`npm view ${name}@${version} version 2>/dev/null`, {
    encoding: 'utf-8',
  }).trim();

  if (existing === version) {
    console.log(`⏭  ${name}@${version} already published — skipping`);
    process.exit(0);
  }
} catch {
  // npm view returns non-zero when the version (or package) doesn't exist — proceed to publish
}

console.log(`📦 Publishing ${name}@${version}...`);
try {
  execSync('bun publish --provenance', { cwd, stdio: 'inherit' });
} catch (err: any) {
  process.exit(err.status ?? 1);
}
