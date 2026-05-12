import { execFileSync } from 'node:child_process';

export type PlatformPackageInfo = {
  packageName: string;
  binaryFileName: string;
};

function isMusl(): boolean {
  if (process.platform !== 'linux') return false;

  try {
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

export function getPlatformPackageInfo(): PlatformPackageInfo {
  if (process.platform === 'darwin') {
    if (process.arch === 'arm64') {
      return {
        packageName: '@bloque/cli-darwin-arm64',
        binaryFileName: 'bloque-darwin-arm64',
      };
    }
    if (process.arch === 'x64') {
      return {
        packageName: '@bloque/cli-darwin-x64',
        binaryFileName: 'bloque-darwin-x64',
      };
    }
  }

  if (process.platform === 'linux') {
    const muslSuffix = isMusl() ? '-musl' : '';
    if (process.arch === 'arm64') {
      return {
        packageName: `@bloque/cli-linux-arm64${muslSuffix}`,
        binaryFileName: `bloque-linux-arm64${muslSuffix}`,
      };
    }
    if (process.arch === 'x64') {
      return {
        packageName: `@bloque/cli-linux-x64${muslSuffix}`,
        binaryFileName: `bloque-linux-x64${muslSuffix}`,
      };
    }
  }

  if (process.platform === 'win32' && process.arch === 'x64') {
    return {
      packageName: '@bloque/cli-windows-x64',
      binaryFileName: 'bloque-windows-x64.exe',
    };
  }

  throw new Error(
    `Unsupported platform for Bloque CLI: ${process.platform}-${process.arch}`,
  );
}
