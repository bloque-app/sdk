#!/usr/bin/env bun
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readdirSync } from 'node:fs';

const root = join(import.meta.dirname, '..');
const packagesDir = join(root, 'packages');

const args = process.argv.slice(2);
const bump = args[0]; // "patch" | "minor" | "major" | explicit version like "0.0.44"

if (!bump) {
  console.error('Usage: bun scripts/bump.ts <patch|minor|major|x.y.z>');
  process.exit(1);
}

function nextVersion(current: string, bump: string): string {
  if (/^\d+\.\d+\.\d+$/.test(bump)) return bump;

  const [major, minor, patch] = current.split('.').map(Number);
  switch (bump) {
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'major':
      return `${major + 1}.0.0`;
    default:
      console.error(`Invalid bump type: ${bump}. Use patch, minor, major, or an explicit version.`);
      process.exit(1);
  }
}

const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const firstPkg = JSON.parse(readFileSync(join(packagesDir, packageDirs[0], 'package.json'), 'utf-8'));
const currentVersion = firstPkg.version;
const newVersion = nextVersion(currentVersion, bump);

console.log(`Bumping all packages: ${currentVersion} → ${newVersion}\n`);

for (const dir of packageDirs) {
  const pkgPath = join(packagesDir, dir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const oldVersion = pkg.version;
  pkg.version = newVersion;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`  ${pkg.name}: ${oldVersion} → ${newVersion}`);
}

console.log(`\nDone. ${packageDirs.length} packages bumped to ${newVersion}.`);
