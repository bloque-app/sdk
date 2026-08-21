# Compliance gate checks

Local, no-mocking checks that exercise the compliance-gate SDK support
(`compliance.tiers`, `compliance.tosGate`, `compliance.verificationGate`,
`BloqueVerificationRequiredError`, `BloqueVerificationPendingError`)
against a **real sandbox backend**.
Every request is real HTTP — nothing here stubs `fetch` or fakes a
response.

They prove two things end to end:

- **Check A** (`compliance-tos-required.check.ts`): a brand-new identity is
  blocked from an RTP payout until it accepts the Terms of Service, and the
  block resolves once TOS is actually accepted through the hosted TOS gate.
- **Check B** (`compliance-venezuela-earthquake.check.ts`): a Venezuela
  resident is blocked by TOS first (same as anyone else), then — after
  accepting it — is blocked again by the Venezuela-specific earthquake
  impact questionnaire (in addition to KYC), that questionnaire can be
  submitted through the hosted verification gate, and — this is the
  important, possibly-surprising part — **retrying immediately after
  submission is still blocked**, because a customer's own submission never
  self-satisfies a manual-review requirement. What it is *not* is blocked
  the same way: the questionnaire moves into `pendingRequirements`, the
  block stops pointing at the documents gate, and re-running the gate's
  `init()` reports it as under review instead of collecting it again.

They are not `bun test` suites (there's no assertion framework wired up):
each one is a runnable script that narrates what it's doing and exits
non-zero with a clear message on the first unmet assertion.

## Prerequisites

1. **Sandbox credentials.** Copy `.env.example` to the repo root's `.env`
   (the SDK auto-loads `.env` via Bun — see `CLAUDE.md`) and fill in:

   - `ORIGIN` / `ORIGIN_KEY` — an origin that supports `originKey` auth (the
     only auth strategy `SDK.register()` supports, which these checks need
     to create an isolated fresh identity per run). The root `.env` used by
     `examples/` already has a working pair for `bloque-root` if you don't
     have your own.
   - `CHECK_RETURN_URL` — **must already be allowlisted** on the backend
     (`TOS_GATE_RETURN_URL_ALLOWLIST` / `VERIFICATION_GATE_RETURN_URL_ALLOWLIST`
     in payment-rails' Origins service config), or `tosGate.start()` /
     `verificationGate.start()` fail with `E_RETURN_URL_NOT_ALLOWED` before
     either check reaches the assertion it's actually testing. For
     `verificationGate.start()` only, the check's origin registering its
     own `metadata.verification_gate_return_url_allowlist` also satisfies
     this — the env var isn't the only option there. Ask whoever owns the
     sandbox deploy to confirm/extend one of the two if you get that
     error.

2. **Compliance enforce mode.** These checks assume the compliance gate is
   already running in `enforce` mode (not `shadow`/`log-only`) for the
   action they exercise (`swap` → `swap.rtp.create()`). In shadow mode the
   RTP call will simply succeed and Check A's very first assertion
   ("swap.rtp.create() unexpectedly succeeded") will fail — that's the
   check correctly telling you enforce mode isn't on for this surface, not
   a bug in the check.

3. **A funded kusama↔rtp rate must exist in sandbox.** Both checks call
   `swap.findRates()` before attempting the payout; if no rate is returned
   they fail immediately with a message that says so explicitly (an
   environment prerequisite, not a compliance regression).

4. **Packages must be built** (compiled from `packages/*/src` into
   `dist/`, which is what `@bloque/sdk-core`/`@bloque/sdk-compliance`/etc.
   resolve to via their `package.json` `exports`) whenever you change
   `packages/core` or `packages/compliance` source:

   ```bash
   bun run build:core && bun run build:compliance && bun run build:sdk
   ```

   (The checks themselves import `packages/sdk/src/index.ts` directly by
   relative path — mirroring `examples/swap/rtp-payout.ts` — so the *SDK*
   package doesn't need rebuilding for changes to itself, but its
   dependencies `@bloque/sdk-core`/`@bloque/sdk-compliance` are resolved
   through their built `dist/`, so those two do.)

## Running

```bash
bun run checks/compliance-tos-required.check.ts
bun run checks/compliance-venezuela-earthquake.check.ts
bun run checks/origin-operator-read-only.check.ts
```

`origin-operator-read-only.check.ts` skips (exit 0) unless
`ORIGIN_OPERATOR_USER_TOKEN` and `ORIGIN_OPERATOR_NAMESPACE` are set — bind
is ops-only. It exercises `orgs.assumeOrigin()`, bound `apiKeys.create`,
and discovery `apiKeys.exchange({ key })`.

Each check registers its own brand-new identity (unique alias per run), so
they're safe to re-run repeatedly without cleanup.

## What Check B asserts after submission: pending ≠ satisfied, but also ≠ missing

A customer's own verification-gate submission never satisfies a
requirement. `VerificationGateController.submit` records it as
`pending_review`, `source: "customer_submission"`, with the form answers
and the confirmed uploads together in one `metadata` envelope — it never
writes `status: "satisfied"` itself. Every `manual_review` requirement
(the earthquake declaration included) needs a separate ops-reviewer call
to the requirement-decision endpoint with `status: "satisfied"` before it
counts toward the identity's effective tier (see
`tier-policies/default.json`'s Venezuela profile comment in
payment-rails).

`pending_review` blocks the level exactly like `not_satisfied` does. The
difference is that it is observable, so the client can tell "never
submitted" from "submitted, awaiting review":

- The requirement appears in **both** `missingRequirements` and
  `pendingRequirements` on the error.
- The compliance engine stops offering a `document_submission` handoff for
  it, so `getVerificationLink()` returns `null` once the declaration is
  the only non-KYC thing outstanding.
- When *everything* outstanding is pending, `decide()` throws
  `E_VERIFICATION_PENDING` → `BloqueVerificationPendingError` instead of
  `BloqueVerificationRequiredError`. That error deliberately has no
  `getVerificationLink()`: there is nothing left for the customer to do.
- The hosted gate's `init()` returns it under `pendingRequirements` rather
  than `requirements`, so the page shows it read-only instead of
  collecting it twice.

Check B asserts all of this in its last two steps. Which of the two error
types you get depends on whether the sandbox policy still has KYC
outstanding alongside the declaration, so the check accepts either and
asserts the part that must hold in both: the declaration is reported as
pending, and the customer is not sent back to resubmit it.

Check B intentionally stops there rather than at "the requirement is now
satisfied" — that is not achievable from the customer side by design (it
requires a separate ops action this check has no access to), and is not a
gap in the SDK or this check.

## CI

Not wired up yet — these are meant to be run locally against sandbox first.
See the plan doc this was implemented from for the deferred CI follow-up.
