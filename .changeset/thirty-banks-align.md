---
'@bloque/sdk-swap': minor
---

Align `SupportedBank` with Cobre's Colombian bank catalog

`SupportedBank` had drifted from the backend's real bank catalog — it was missing `daviplata`,
`nubank`, `rappipay` (live on the backend for months) and `nequi` (live but never exposed here).
The client confirmed Cobre's official bank list as canonical going forward.

- Added the 19 banks Cobre supports that weren't in the SDK: `bancoldex`, `dale`,
  `financiera_juriscoop`, `cooperativa_financiera_de_antioquia`, `jfk_cooperativa_financiera`,
  `cootrafa`, `confiar`, `coltefinanciera`, `pibank`, `iris`, `movii`, `ding_tecnipagos`, `powwi`,
  `uala`, `bold_cf`, `coink`, `global66`, `alianza_fiduciaria`, `crezcamos`.
- Added `daviplata`, `nubank`, `rappipay`, `nequi` — already valid backend `to_medium` values that
  the SDK never exposed.
- Removed `banco_contactar` — not present in Cobre's catalog.
