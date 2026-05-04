#!/usr/bin/env node

const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const { resolveBinaryPath } = require('../npm/resolve-binary.cjs');

const binaryPath = resolveBinaryPath();

if (process.platform !== 'win32') {
  try {
    fs.chmodSync(binaryPath, 0o755);
  } catch {}
}

const result = spawnSync(binaryPath, process.argv.slice(2), {
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

if (typeof result.status === 'number') {
  process.exit(result.status);
}
