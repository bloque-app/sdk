---
"@bloque/sdk-swap": minor
"@bloque/sdk": minor
---

`calculateRateQuote(rate, amountSrc)` returns what a rate delivers for a specific amount: the amount received, the total fee and one line per percentage or fixed component, all in destination atoms, with the server's exact arithmetic and rounding. `ratio` only holds for the reference amount when the fee has a fixed part, such as SPEI's 5 MXN. Fee components now expose `role` and `roleExpression`, and `percentage`, `amount` and `Fee.value` are typed `number | string`, matching what the API returns.
