// Batch Transfer
//
// Send multiple transfers in a single call. Perfect for payroll,
// splitting bills, or distributing funds across many accounts.
//
// Large batches (80+ operations) are automatically chunked for you.
// Each chunk gets its own queue ID for tracking.

import { SDK } from '../../packages/sdk/src/index';

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'apiKey',
    apiKey: process.env.API_KEY!,
  },
  mode: process.env.MODE as 'production' | 'sandbox',
});

const user = await bloque.connect('@nestor');

// Setup: a treasury and three employee pockets
const treasury = await user.accounts.virtual.create(
  { name: 'Treasury' },
  { waitLedger: true },
);

const alice = await user.accounts.virtual.create(
  { name: 'Alice' },
  { waitLedger: true },
);

const bob = await user.accounts.virtual.create(
  { name: 'Bob' },
  { waitLedger: true },
);

const carol = await user.accounts.virtual.create(
  { name: 'Carol' },
  { waitLedger: true },
);

// Pay everyone in one batch
const result = await user.accounts.batchTransfer({
  reference: 'payroll-2025-02',
  operations: [
    {
      fromUrn: treasury.urn,
      toUrn: alice.urn,
      reference: 'salary-alice-feb',
      amount: '3000000000', // 3,000 DUSD
      asset: 'DUSD/6',
      metadata: { employee: 'alice', type: 'salary' },
    },
    {
      fromUrn: treasury.urn,
      toUrn: bob.urn,
      reference: 'salary-bob-feb',
      amount: '2500000000', // 2,500 DUSD
      asset: 'DUSD/6',
      metadata: { employee: 'bob', type: 'salary' },
    },
    {
      fromUrn: treasury.urn,
      toUrn: carol.urn,
      reference: 'salary-carol-feb',
      amount: '2800000000', // 2,800 DUSD
      asset: 'DUSD/6',
      metadata: { employee: 'carol', type: 'salary' },
    },
  ],
  metadata: { department: 'engineering', period: '2025-02' },
  webhookUrl: 'https://api.example.com/webhooks/payroll',
});

console.log(`Batch sent: ${result.totalOperations} operations in ${result.totalChunks} chunk(s)`);

for (const chunk of result.chunks) {
  console.log(`  Chunk ${chunk.queueId}: ${chunk.status} — ${chunk.message}`);
}
