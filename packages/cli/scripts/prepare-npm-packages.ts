import fs from 'node:fs';
import path from 'node:path';
import packageJson from '../package.json';

const outputDir = './dist/npm';
const rootPackageDir = path.join(outputDir, 'root');
const binarySourceDir = './dist/bin';
const launcherSourcePath = './bin/npm.cjs';
const installScriptSourcePath = './npm/install.cjs';
const resolveBinarySourcePath = './npm/resolve-binary.cjs';
const npmReadmeSourcePath = './README.md';
const licenseSourcePath = './LICENSE';

type PlatformPackage = {
  binaryFile: string;
  cpu: string[];
  libc?: string[];
  name: string;
  os: string[];
};

const platformPackages: PlatformPackage[] = [
  {
    name: '@bloque/cli-darwin-arm64',
    binaryFile: 'bloque-darwin-arm64',
    os: ['darwin'],
    cpu: ['arm64'],
  },
  {
    name: '@bloque/cli-darwin-x64',
    binaryFile: 'bloque-darwin-x64',
    os: ['darwin'],
    cpu: ['x64'],
  },
  {
    name: '@bloque/cli-linux-arm64',
    binaryFile: 'bloque-linux-arm64',
    os: ['linux'],
    cpu: ['arm64'],
    libc: ['glibc'],
  },
  {
    name: '@bloque/cli-linux-x64',
    binaryFile: 'bloque-linux-x64',
    os: ['linux'],
    cpu: ['x64'],
    libc: ['glibc'],
  },
  {
    name: '@bloque/cli-linux-arm64-musl',
    binaryFile: 'bloque-linux-arm64-musl',
    os: ['linux'],
    cpu: ['arm64'],
    libc: ['musl'],
  },
  {
    name: '@bloque/cli-linux-x64-musl',
    binaryFile: 'bloque-linux-x64-musl',
    os: ['linux'],
    cpu: ['x64'],
    libc: ['musl'],
  },
];

function ensureFileExists(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required build artifact not found: ${filePath}`);
  }
}

fs.rmSync(outputDir, { force: true, recursive: true });
fs.mkdirSync(rootPackageDir, { recursive: true });

const optionalDependencies = Object.fromEntries(
  platformPackages.map((platformPackage) => [
    platformPackage.name,
    packageJson.version,
  ]),
);

const rootPackageJson = {
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  keywords: packageJson.keywords,
  bin: {
    bloque: './bin/npm.cjs',
  },
  scripts: {
    postinstall: 'node ./npm/install.cjs',
  },
  files: [
    'bin/npm.cjs',
    'npm/install.cjs',
    'npm/resolve-binary.cjs',
    'README.md',
  ],
  optionalDependencies,
  publishConfig: packageJson.publishConfig,
};

fs.writeFileSync(
  path.join(rootPackageDir, 'package.json'),
  `${JSON.stringify(rootPackageJson, null, 2)}\n`,
  'utf8',
);
fs.mkdirSync(path.join(rootPackageDir, 'bin'), { recursive: true });
fs.mkdirSync(path.join(rootPackageDir, 'npm'), { recursive: true });
fs.copyFileSync(
  launcherSourcePath,
  path.join(rootPackageDir, 'bin', 'npm.cjs'),
);
fs.copyFileSync(
  installScriptSourcePath,
  path.join(rootPackageDir, 'npm', 'install.cjs'),
);
fs.copyFileSync(
  resolveBinarySourcePath,
  path.join(rootPackageDir, 'npm', 'resolve-binary.cjs'),
);
fs.copyFileSync(npmReadmeSourcePath, path.join(rootPackageDir, 'README.md'));
fs.copyFileSync(licenseSourcePath, path.join(rootPackageDir, 'LICENSE'));

for (const platformPackage of platformPackages) {
  const packageDir = path.join(outputDir, platformPackage.name.split('/')[1]);
  const sourceBinaryPath = path.join(
    binarySourceDir,
    platformPackage.binaryFile,
  );
  const targetBinaryDir = path.join(packageDir, 'bin');
  const targetBinaryPath = path.join(
    targetBinaryDir,
    platformPackage.binaryFile,
  );

  ensureFileExists(sourceBinaryPath);

  fs.mkdirSync(targetBinaryDir, { recursive: true });
  fs.copyFileSync(sourceBinaryPath, targetBinaryPath);

  if (!platformPackage.binaryFile.endsWith('.exe')) {
    fs.chmodSync(targetBinaryPath, 0o755);
  }

  const platformPackageJson = {
    name: platformPackage.name,
    version: packageJson.version,
    description: `${packageJson.description} (${platformPackage.binaryFile})`,
    os: platformPackage.os,
    cpu: platformPackage.cpu,
    libc: platformPackage.libc,
    files: ['bin'],
    publishConfig: packageJson.publishConfig,
  };

  fs.writeFileSync(
    path.join(packageDir, 'package.json'),
    `${JSON.stringify(platformPackageJson, null, 2)}\n`,
    'utf8',
  );
}
