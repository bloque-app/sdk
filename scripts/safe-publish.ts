#!/usr/bin/env bun
/**
 * Publishes the current package only if this version isn't already on npm.
 * Designed to be called from each package's "release" script so that
 * `bun run -r --parallel --filter='./packages/*' release` is idempotent.
 */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
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

// npm publishes (npm >= 11.5 authenticates through GitHub's OIDC token: npm trusted publishing, no
// NPM_TOKEN, and attaches provenance). npm doesn't understand `workspace:` versions, so they are
// resolved here from each sibling's own package.json (never from the lockfile, which can lag a
// release bump), written for the publish, and restored afterwards.
const root = join(cwd, '..', '..');
const versions = new Map<string, string>();
for (const dir of readdirSync(join(root, 'packages'))) {
  try {
    const p = JSON.parse(readFileSync(join(root, 'packages', dir, 'package.json'), 'utf-8'));
    versions.set(p.name, p.version);
  } catch {
    // not a package directory
  }
}
const resolve = (dep: string, spec: string): string => {
  if (!spec.startsWith('workspace:')) return spec;
  const v = versions.get(dep);
  if (!v) throw new Error(`${name}: ${dep} is a workspace dependency with no package in packages/`);
  const range = spec.slice('workspace:'.length);
  if (range === '*' || range === '') return v;
  if (range === '^' || range === '~') return `${range}${v}`;
  return range;
};
const original = readFileSync(join(cwd, 'package.json'), 'utf-8');
const manifest = JSON.parse(original);
for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies', 'devDependencies']) {
  for (const [dep, spec] of Object.entries<string>(manifest[field] ?? {})) {
    manifest[field][dep] = resolve(dep, spec);
  }
}
try {
  writeFileSync(join(cwd, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  execSync('npm publish --provenance --access public', { cwd, stdio: 'inherit' });
} catch (err: any) {
  process.exitCode = err.status ?? 1;
} finally {
  writeFileSync(join(cwd, 'package.json'), original);
}
