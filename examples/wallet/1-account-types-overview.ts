import { SDK } from '../../packages/sdk/src/index';

/**
 * Account types overview.
 *
 * A "virtual" account is the simplest one — it just holds a balance
 * (a "pocket"). Every other account type either mints its own balance the
 * same way, or attaches to an existing one via `ledgerId`.
 *
 * All account types share the same `create()` shape: `{ ledgerId?, name?,
 * holderUrn?, webhookUrl?, metadata? }` plus type-specific fields, and the
 * same lifecycle methods (`activate`, `freeze`, `disable`) where applicable.
 *
 *   virtual            — this file. Just a balance, no external rail.
 *   card               — examples/internal-operations/card/*, examples/movimientos/internos/*
 *   polygon            — examples/internal-operations/8-add-multiple-accounts.ts
 *   breb (key account) — examples/internal-operations/breb/create-breb-key.ts and siblings
 *   us (FDIC US bank)  — user.accounts.us.create(), gated by TOS: examples/internal-operations/11-tos-accept.ts
 *   us2                — user.accounts.us2.create({ type, email, phone })
 *   external-us-bank   — examples/internal-operations/external-us-bank-hosted-plaid-link.ts (linking),
 *                        examples/movimientos/payin/external-us-bank-ach-kusama.ts (pull)
 */

const bloque = new SDK({
  origin: process.env.ORIGIN!,
  auth: {
    type: 'originKey',
    originKey: process.env.ORIGIN_KEY!,
  },
  mode: process.env.MODE as 'production' | 'sandbox',
});

const user = await bloque.connect('@nestor');

const pocket = await user.accounts.virtual.create(
  { name: 'Main pocket' },
  { waitLedger: true, idempotencyKey: 'account-types-overview-main-pocket' },
);

console.log('Virtual account (pocket) ready:', pocket.urn, pocket.ledgerId);

// Every other account type can share this same balance via `ledgerId`:
const card = await user.accounts.card.create(
  { ledgerId: pocket.ledgerId, name: 'Everyday card' },
  { waitLedger: true, idempotencyKey: 'account-types-overview-card' },
);
console.log('Card sharing the same balance:', card.urn);
