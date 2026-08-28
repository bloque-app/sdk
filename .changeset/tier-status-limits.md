---
"@bloque/sdk-compliance": patch
"@bloque/sdk": patch
---

Surface live money limits on `compliance.tiers.getStatus()`:

- **`TierStatus.limits`** — the effective tier's per-transaction cap (when
  configured) and live consumed/remaining/reset for each UTC window
  (`day` / `week` / `month` / `year`). Amounts are USD decimal strings at
  scale 100 (`"6000.00"`), same as `BloqueTierLimitExceededError`. Empty
  `windows` below level 0, for ungated identities, or when the satisfied
  tier has no window rules. Additive; older backends omit the wire field
  and the SDK maps that to `{ windows: [] }`.
