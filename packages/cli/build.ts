import packageJson from './package.json';

const entrypoint = './bin/index.ts';
const outputDir = './dist/bin';
const binaryName = 'bloque';

const targets = [
  ['bun-darwin-arm64', `${outputDir}/${binaryName}-darwin-arm64`],
  ['bun-darwin-x64', `${outputDir}/${binaryName}-darwin-x64`],
  ['bun-linux-x64', `${outputDir}/${binaryName}-linux-x64`],
  ['bun-linux-arm64', `${outputDir}/${binaryName}-linux-arm64`],
  ['bun-linux-x64-musl', `${outputDir}/${binaryName}-linux-x64-musl`],
  ['bun-linux-arm64-musl', `${outputDir}/${binaryName}-linux-arm64-musl`],
] as const;

await Bun.$`mkdir -p ${outputDir}`;

for (const [target, outfile] of targets) {
  console.log(`Building ${target}...`);

  const result = await Bun.build({
    entrypoints: [entrypoint],
    minify: true,
    target: 'bun',
    compile: {
      target,
      outfile,
    },
    define: {
      'process.env.BLOQUE_VERSION': JSON.stringify(packageJson.version),
    },
  });

  if (!result.success) {
    for (const log of result.logs) {
      console.error(log.message);
    }

    process.exit(1);
  }
}
