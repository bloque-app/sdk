#!/usr/bin/env bun
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const versionPath = join(root, 'packages/core/src/version.ts');
const { version } = JSON.parse(
  readFileSync(join(root, 'packages/sdk/package.json'), 'utf-8'),
) as { version: string };

const source = readFileSync(versionPath, 'utf-8');
const pattern = /export const SDK_VERSION = '[^']*';/;
if (!pattern.test(source)) {
  console.error(`SDK_VERSION not found in ${versionPath}`);
  process.exit(1);
}
writeFileSync(
  versionPath,
  source.replace(pattern, `export const SDK_VERSION = '${version}';`),
);
console.log(`SDK_VERSION → ${version}`);
