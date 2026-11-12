---
"@bloque/sdk-core": patch
---

The `X-Bloque-SDK` header sends the real SDK version again. It had stayed at `0.21.0` since 0.22; `bun run version` now keeps `SDK_VERSION` in sync.
