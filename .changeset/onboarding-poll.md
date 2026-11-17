---
"@bloque/sdk-agents": minor
---

`agents.apps.recommend()` now admits an onboarding job (`pending` + `id`). Poll `agents.onboarding.get(id)` until `ready` or `unavailable`.
