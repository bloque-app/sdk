---
"@bloque/sdk-agents": patch
---

`agents.apps.recommend()` maps missing `data` and `included` to `[]` so a `source: "failed"` answer is returned instead of throwing.
