import { defineConfig } from '@rslib/core';

export default defineConfig({
  source: {
    entry: {
      index: './src/index.ts',
      init: './src/init.ts',
      accounts: './src/accounts.ts',
      compliance: './src/compliance.ts',
      identity: './src/identity.ts',
      orgs: './src/orgs.ts',
      swap: './src/swap.ts',
    },
  },
  lib: [
    {
      format: 'esm',
      syntax: ['node 22'],
      output: { minify: true },
      dts: true,
    },
    {
      format: 'cjs',
      syntax: ['node 22'],
      output: { minify: true },
    },
  ],
});
