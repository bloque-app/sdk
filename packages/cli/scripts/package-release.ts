import fs from 'node:fs';
import path from 'node:path';
import packageJson from '../package.json';

const binaryName = 'bloque';
const sourceDir = path.resolve('./dist/bin');
const outputDir = path.resolve('./dist/release');

const releaseArtifacts = [
  [
    `${binaryName}-darwin-arm64`,
    `${binaryName}-${packageJson.version}-darwin-arm64.tar.gz`,
    'tar.gz',
  ],
  [
    `${binaryName}-darwin-x64`,
    `${binaryName}-${packageJson.version}-darwin-x64.tar.gz`,
    'tar.gz',
  ],
  [
    `${binaryName}-linux-arm64`,
    `${binaryName}-${packageJson.version}-linux-arm64.tar.gz`,
    'tar.gz',
  ],
  [
    `${binaryName}-linux-x64`,
    `${binaryName}-${packageJson.version}-linux-x64.tar.gz`,
    'tar.gz',
  ],
  [
    `${binaryName}-linux-arm64-musl`,
    `${binaryName}-${packageJson.version}-linux-arm64-musl.tar.gz`,
    'tar.gz',
  ],
  [
    `${binaryName}-linux-x64-musl`,
    `${binaryName}-${packageJson.version}-linux-x64-musl.tar.gz`,
    'tar.gz',
  ],
] as const;

function ensureSafeStagingDir(stagingDir: string) {
  const relativePath = path.relative(outputDir, stagingDir);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Unsafe staging directory: ${stagingDir}`);
  }
}

function recreateStagingDir(stagingDir: string) {
  ensureSafeStagingDir(stagingDir);
  fs.rmSync(stagingDir, { force: true, recursive: true });
  fs.mkdirSync(path.join(stagingDir, 'bin'), { recursive: true });
}

fs.mkdirSync(outputDir, { recursive: true });

const checksums: string[] = [];

for (const [sourceName, assetName, archiveType] of releaseArtifacts) {
  const sourcePath = path.join(sourceDir, sourceName);
  const outputPath = path.join(outputDir, assetName);
  const stagingDir = path.join(outputDir, `${sourceName}-package`);

  if (archiveType === 'tar.gz') {
    recreateStagingDir(stagingDir);
    fs.copyFileSync(sourcePath, path.join(stagingDir, 'bin', sourceName));
    await Bun.$`tar -czf ${outputPath} -C ${stagingDir} .`;
    fs.rmSync(stagingDir, { force: true, recursive: true });
  } else {
    await Bun.$`zip -j ${outputPath} ${sourcePath}`;
  }

  const hash = (await Bun.$`sha256sum ${outputPath}`.text()).trim();
  checksums.push(hash);
}

await Bun.write(
  path.join(outputDir, 'checksums.txt'),
  `${checksums.join('\n')}\n`,
);
