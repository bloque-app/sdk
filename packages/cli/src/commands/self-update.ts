import fs from 'node:fs';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { Command } from 'commander';

import { getPlatformPackageInfo } from '../core/platform.ts';
import { CURRENT_VERSION, NPM_PACKAGE_NAME } from '../core/version.ts';
import { CliError } from '../utils/errors.ts';
import { logger } from '../utils/logger.ts';

type SelfUpdateOptions = {
  version?: string;
};

type NpmVersionMetadata = {
  version?: string;
  dist?: {
    tarball?: string;
  };
};

type NpmPackageMetadata = {
  'dist-tags'?: {
    latest?: string;
  };
  versions?: Record<string, NpmVersionMetadata>;
};

function getCurrentExecutablePath() {
  const execPath = process.execPath;
  const baseName = path.basename(execPath).toLowerCase();

  if (baseName === 'bun' || baseName === 'bun.exe' || baseName === 'node' || baseName === 'node.exe') {
    throw new CliError(
      'Self-update must be run from an installed Bloque binary, not from a JS runtime.',
    );
  }

  return execPath;
}

function request(url: string) {
  return new Promise<Buffer>((resolve, reject) => {
    https
      .get(url, (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          request(response.headers.location).then(resolve, reject);
          return;
        }

        if (
          !response.statusCode ||
          response.statusCode < 200 ||
          response.statusCode >= 300
        ) {
          reject(
            new CliError(
              `Failed to download from npm. Registry responded with ${response.statusCode}.`,
            ),
          );
          return;
        }

        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        response.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', (error) => {
        reject(
          new CliError(
            `Unable to reach npm registry: ${error.message || String(error)}`,
          ),
        );
      });
  });
}

function extractFileFromTarball(tarballBuffer: Buffer, filePath: string) {
  let offset = 0;

  while (offset < tarballBuffer.length) {
    const header = tarballBuffer.subarray(offset, offset + 512);
    offset += 512;

    const currentFileName = header
      .toString('utf8', 0, 100)
      .replace(/\0.*/g, '');

    if (!currentFileName) {
      break;
    }

    const fileSize = Number.parseInt(
      header.toString('utf8', 124, 136).replace(/\0.*/g, '').trim() || '0',
      8,
    );

    if (currentFileName === filePath) {
      return tarballBuffer.subarray(offset, offset + fileSize);
    }

    offset = (offset + fileSize + 511) & ~511;
  }

  throw new CliError(`File not found in tarball: ${filePath}`);
}

async function getPackageVersion(
  packageName: string,
  requestedVersion?: string,
) {
  const packageMetadataUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
  const packageMetadataBuffer = await request(packageMetadataUrl);
  const packageMetadata = JSON.parse(
    packageMetadataBuffer.toString('utf8'),
  ) as NpmPackageMetadata;

  const resolvedVersion =
    requestedVersion ?? packageMetadata['dist-tags']?.latest;

  if (!resolvedVersion) {
    throw new CliError(`Latest version not found for ${packageName}.`);
  }

  const versionMetadata = packageMetadata.versions?.[resolvedVersion];

  if (!versionMetadata?.dist?.tarball) {
    throw new CliError(
      `Version ${resolvedVersion} was not found for ${packageName}.`,
    );
  }

  return {
    version: resolvedVersion,
    tarballUrl: versionMetadata.dist.tarball,
  };
}

async function replaceExecutable(currentPath: string, nextPath: string) {
  const tempPath = `${currentPath}.next`;
  fs.copyFileSync(nextPath, tempPath);
  if (process.platform !== 'win32') fs.chmodSync(tempPath, 0o755);
  fs.renameSync(tempPath, currentPath);
}

export async function selfUpdateCommand(options: SelfUpdateOptions = {}) {
  const currentVersion = CURRENT_VERSION;
  const currentExecutablePath = getCurrentExecutablePath();
  const platformPackage = getPlatformPackageInfo();

  logger.step(`Current version: ${currentVersion}`);
  logger.step(
    options.version
      ? `Looking for npm version ${options.version}`
      : `Looking for latest npm version of ${NPM_PACKAGE_NAME}`,
  );

  const targetRootPackage = await getPackageVersion(
    NPM_PACKAGE_NAME,
    options.version,
  );

  if (!options.version && targetRootPackage.version === currentVersion) {
    logger.success(`Bloque CLI is already up to date (${currentVersion})`);
    return;
  }

  const targetPlatformPackage = await getPackageVersion(
    platformPackage.packageName,
    targetRootPackage.version,
  );

  logger.step(
    `Downloading ${platformPackage.packageName}@${targetPlatformPackage.version}`,
  );

  const tarballDownloadBuffer = await request(targetPlatformPackage.tarballUrl);
  const tarballBuffer = zlib.unzipSync(tarballDownloadBuffer);
  const binaryBuffer = extractFileFromTarball(
    tarballBuffer,
    `package/bin/${platformPackage.binaryFileName}`,
  );

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bloque-update-'));
  const extractedBinaryPath = path.join(
    tempDir,
    platformPackage.binaryFileName,
  );
  fs.writeFileSync(
    extractedBinaryPath,
    binaryBuffer,
    process.platform === 'win32' ? undefined : { mode: 0o755 },
  );

  logger.step(`Replacing binary at ${currentExecutablePath}`);
  await replaceExecutable(currentExecutablePath, extractedBinaryPath);

  logger.success(
    `Updated Bloque CLI from ${currentVersion} to ${targetRootPackage.version}`,
  );
}

export const selfUpdateCliCommand = new Command('self-update')
  .description('Update the installed Bloque binary to the latest (or specific) version')
  .option('-v, --version <version>', 'Target version to install')
  .action(async (opts) => {
    try {
      await selfUpdateCommand(opts as SelfUpdateOptions);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      console.error(message);
      process.exit(1);
    }
  });
