# @bloque/cli

Authenticate with Bloque, expose the full SDK as an MCP server, and let AI agents manage accounts, cards, and transfers on your behalf.

```bash
npx @bloque/cli setup
```

## Quick Start

The setup wizard logs you in, detects your installed AI code agents, and configures everything automatically:

```
$ npx @bloque/cli setup

  Bloque Setup Wizard

? How would you like to receive your OTP?  WhatsApp
? Phone number:  +573001234567
  OTP sent via WhatsApp — check your phone.
? Enter OTP code:  ****

  Logged in as did:bloque:bloque-whatsapp:+573001234567

? Which agents should Bloque be installed in?
  [x] Cursor (detected)
  [x] Claude Desktop (detected)
  [x] Claude Code (detected)
  [x] Antigravity (detected)

  Installing MCP server config...
    Cursor: added
    Claude Desktop: added
    Claude Code: added
    Antigravity: added

  Installing Bloque SDK skill...
    Cursor: done
    Claude Code: done
    Antigravity: done

  Setup complete!
```

Restart your agent and start asking it to create cards, move funds, or check balances.

If you already have a JWT token (e.g. from the Bloque dashboard), skip the OTP flow:

```bash
npx @bloque/cli setup --jwt eyJhbGciOi...
```

## Commands

| Command | Description |
|---------|-------------|
| `bloque setup` | Interactive wizard: authenticate + install MCP in your agents |
| `bloque login` | Authenticate via OTP (WhatsApp/Email) or API key |
| `bloque logout` | Clear the local session |
| `bloque whoami` | Show the current session |
| `bloque mcp` | Start the MCP server (stdio) |
| `bloque mcp --http` | Start the MCP server over HTTP |

### `bloque setup`

```
Options:
  --jwt <token>   JWT token (skips OTP login)
  --sandbox       Use sandbox environment instead of production
```

### `bloque login`

```
Options:
  --api-key <key>    API key for backend authentication
  --origin <origin>  Origin (only needed with --api-key)
  --alias <alias>    Alias (required with --api-key)
  --sandbox          Use sandbox environment
```

### `bloque mcp`

```
Options:
  --http           Use HTTP transport instead of stdio
  --port <port>    HTTP port (default: 3100)
```

## MCP Tools

The server exposes **38 tools** organized in two tiers:

### Primitives (26 tools)

Low-level, 1:1 with SDK methods. Full control.

| Domain | Tools |
|--------|-------|
| Accounts | `list_accounts`, `get_account`, `get_balance`, `get_all_balances` |
| Virtual | `create_virtual_account`, `list_virtual_accounts` |
| Cards | `create_raw_card`, `list_cards`, `freeze_card`, `activate_card`, `disable_card`, `update_card_metadata`, `rename_card` |
| Polygon | `create_polygon_account`, `list_polygon_accounts` |
| US Bank | `get_us_tos_link`, `create_us_account`, `list_us_accounts` |
| Transfers | `transfer`, `batch_transfer` |
| History | `list_transactions`, `list_account_movements` |
| Swap | `find_rates`, `list_pse_banks`, `create_pse_order`, `create_bank_transfer_order` |

### Workflows (12 tools)

High-level, multi-step operations. One call gets the job done.

| Tool | What it does |
|------|-------------|
| `get_profile` | User identity + KYC status |
| `verify_identity` | Start or check KYC verification |
| `create_account` | Create a pocket + Polygon address (shared ledger) |
| `create_card` | Full card setup: account + polygon + card + optional MCC restrictions + optional funding |
| `create_disposable_card` | One-time card with exact funded amount |
| `fund_card` | Top up a card's backing account |
| `topup_via_pse` | Load COP via PSE bank transfer |
| `cashout_to_bank` | Cash out USD to a Colombian bank |
| `configure_spending_rules` | Smart MCC routing across multiple accounts |
| `add_spending_category` | Add a category + account to card routing |
| `wallet_overview` | All accounts, balances, and recent transactions |
| `card_summary` | Card details, balance, restrictions, and movements |

## Core Concepts

**Accounts hold money, cards spend money.**

An account is a virtual pocket (balance) + Polygon address (receives crypto). A card draws from an account's balance. Multiple cards can share one account.

```
Account: Marketing Budget
  ├── Pocket (balance: $500 USD)
  ├── Polygon (0xabc...def)
  ├── Ads Card [restricted to: ads]
  └── General Card [unrestricted]
```

**Currency abstraction.** All tools accept and return human-readable amounts. Say `"50"` for $50 USD -- the SDK handles `DUSD/6` internally.

**MCC category presets.** Restrict cards with friendly names instead of codes:

| Category | Example merchants |
|----------|-------------------|
| `food` | Grocery stores, restaurants, fast food |
| `transport` | Taxis, rideshare, gas stations, transit |
| `ads` | Advertising services, SaaS platforms |
| `entertainment` | Movies, streaming, concerts, events |
| `health` | Pharmacies, doctors, dentists |
| `shopping` | Department stores, clothing, apparel |
| `travel` | Airlines, hotels, travel agencies |
| `subscriptions` | Digital goods, streaming, games |

## Examples

Ask your AI agent:

> "Create a card that only works for food, fund it with $200"

```
create_card(name: "Food Card", allowedCategories: ["food"], fundFromUrn: "...", fundAmount: "200")
```

> "I need a $25 card for this website"

```
create_disposable_card(sourceUrn: "...", amount: "25", name: "One-time purchase")
```

> "Load 100,000 COP from my bank to my account"

```
topup_via_pse(accountUrn: "...", amount: "100000", bankCode: "1007", ...)
→ returns checkout URL for user to complete at their bank
```

> "Show me everything about my card"

```
card_summary(cardUrn: "...")
→ card details, balance, polygon address, restrictions, recent movements
```

## Supported Agents

| Agent | MCP Config | Skill Install |
|-------|-----------|---------------|
| Cursor | `~/.cursor/mcp.json` | Yes |
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` | -- |
| Claude Code | `~/.claude.json` | Yes |
| Antigravity | `~/.gemini/antigravity/mcp_config.json` | Yes |

## Manual MCP Configuration

If you prefer to configure manually instead of using `bloque setup`, add this to your agent's MCP config:

```json
{
  "mcpServers": {
    "bloque": {
      "command": "npx",
      "args": ["-y", "@bloque/cli", "mcp"]
    }
  }
}
```

Make sure you've logged in first:

```bash
npx @bloque/cli login
```

## Requirements

- Node.js 22+ or Bun 1+
- A [Bloque](https://www.bloque.app) account

## License

MIT
