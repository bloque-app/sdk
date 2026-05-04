const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');
const zlib = require('node:zlib');
const {
  getBinaryFileName,
  getFallbackBinaryPath,
  getPlatformPackageName,
  resolveBinaryPath,
} = require('./resolve-binary.cjs');

const version = require('../package.json').version;

function request(url) {
  return new Promise((resolve, reject) => {
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
            new Error(
              `Failed to download package metadata. npm responded with ${response.statusCode}.`,
            ),
          );
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

async function requestWithRetry(url, retries = 4, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await request(url);
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

function extractFileFromTarball(tarballBuffer, filePath) {
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

  throw new Error(`File not found in tarball: ${filePath}`);
}

function isOptionalPackageInstalled() {
  try {
    const resolvedPath = resolveBinaryPath();
    return (
      fs.existsSync(resolvedPath) && resolvedPath !== getFallbackBinaryPath()
    );
  } catch {
    return false;
  }
}

async function downloadBinaryFromNpm() {
  const packageName = getPlatformPackageName();
  const binaryFileName = getBinaryFileName();
  const packageMetadataUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}/${version}`;
  const packageMetadataBuffer = await requestWithRetry(
    packageMetadataUrl,
  ).catch((error) => {
    throw new Error(
      `Failed to fetch ${packageName}@${version} from npm. ${error instanceof Error ? error.message : String(error)}`,
    );
  });
  const packageMetadata = JSON.parse(packageMetadataBuffer.toString('utf8'));
  const tarballUrl = packageMetadata.dist?.tarball;

  if (!tarballUrl) {
    throw new Error(`Tarball URL not found for ${packageName}@${version}`);
  }

  const tarballDownloadBuffer = await requestWithRetry(tarballUrl);
  const tarballBuffer = zlib.unzipSync(tarballDownloadBuffer);
  const binaryBuffer = extractFileFromTarball(
    tarballBuffer,
    `package/bin/${binaryFileName}`,
  );
  const fallbackBinaryPath = getFallbackBinaryPath();

  fs.mkdirSync(path.dirname(fallbackBinaryPath), { recursive: true });
  fs.writeFileSync(fallbackBinaryPath, binaryBuffer, { mode: 0o755 });
}

(async () => {
  if (isOptionalPackageInstalled()) {
    return;
  }

  console.log(
    'Platform-specific npm package not found. Falling back to downloading the binary from npm.',
  );
  await downloadBinaryFromNpm();
})().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
