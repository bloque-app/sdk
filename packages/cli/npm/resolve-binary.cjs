const path = require('node:path');

function isMusl() {
  if (process.platform !== 'linux') {
    return false;
  }

  try {
    const { execFileSync } = require('node:child_process');
    const output = execFileSync('ldd', ['--version'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return output.toLowerCase().includes('musl');
  } catch (error) {
    const stderr =
      error && typeof error === 'object' && 'stderr' in error
        ? String(error.stderr)
        : '';
    return stderr.toLowerCase().includes('musl');
  }
}

function getPlatformPackageName() {
  if (process.platform === 'darwin') {
    if (process.arch === 'arm64') return '@bloque/cli-darwin-arm64';
    if (process.arch === 'x64') return '@bloque/cli-darwin-x64';
  }

  if (process.platform === 'linux') {
    const muslSuffix = isMusl() ? '-musl' : '';

    if (process.arch === 'arm64') return `@bloque/cli-linux-arm64${muslSuffix}`;
    if (process.arch === 'x64') return `@bloque/cli-linux-x64${muslSuffix}`;
  }

  throw new Error(
    `Unsupported platform for Bloque CLI: ${process.platform}-${process.arch}`,
  );
}

function getBinaryFileName() {
  if (process.platform === 'darwin') {
    return process.arch === 'arm64'
      ? 'bloque-darwin-arm64'
      : 'bloque-darwin-x64';
  }

  if (process.platform === 'linux') {
    const muslSuffix = isMusl() ? '-musl' : '';
    return process.arch === 'arm64'
      ? `bloque-linux-arm64${muslSuffix}`
      : `bloque-linux-x64${muslSuffix}`;
  }
}

function getFallbackBinaryPath() {
  return path.join(__dirname, '..', 'bin', getBinaryFileName());
}

function resolveBinaryPath() {
  const packageName = getPlatformPackageName();
  const binaryFileName = getBinaryFileName();

  try {
    return require.resolve(`${packageName}/bin/${binaryFileName}`);
  } catch {
    return getFallbackBinaryPath();
  }
}

module.exports = {
  getBinaryFileName,
  getFallbackBinaryPath,
  getPlatformPackageName,
  resolveBinaryPath,
};
