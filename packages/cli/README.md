# @bloque/cli

Use Bloque from your AI agent. One command to set up, then just ask.

## Get Started

```bash
npx @bloque/cli setup
```

That's it. The wizard logs you in, finds your AI agents, and configures everything. Restart your agent and you're ready.

## What You Can Ask Your Agent

Once set up, talk to your agent like you would a financial assistant:

- **"Create a card for food expenses, load it with $200"**
- **"I need a one-time $25 card for this website"**
- **"Show me my balances"**
- **"Top up my account with 100,000 COP from my bank"**
- **"Freeze my card"**
- **"What transactions happened this week?"**

Your agent handles the rest — creating accounts, issuing cards, moving money, and reporting back.

## How It Works

The CLI installs an [MCP server](https://modelcontextprotocol.io/) that gives your AI agent access to 38 financial tools. When you ask your agent to create a card, it calls `create_card` behind the scenes — you never need to learn the tool names.

Every card is a **crypto card**: it automatically gets a virtual account (holds the balance) and a Polygon address (receives USDC). You can top up via crypto, PSE bank transfer, or internal transfer.

## Supported Agents

| Agent | Platforms |
|-------|-----------|
| Cursor | macOS, Linux, Windows |
| Claude Desktop | macOS, Windows |
| Claude Code | macOS, Linux, Windows |
| Antigravity (Google) | macOS, Linux, Windows |

## Commands

| Command | What it does |
|---------|-------------|
| `bloque setup` | Wizard: log in + install MCP in your agents |
| `bloque login` | Log in via WhatsApp/Email OTP or API key |
| `bloque logout` | Clear your local session |
| `bloque whoami` | Show who you're logged in as |
| `bloque mcp` | Start the MCP server (stdio) |
| `bloque mcp --http` | Start the MCP server over HTTP |

### Options

**`bloque setup`** — `--jwt <token>` to skip OTP, `--sandbox` for sandbox environment.

**`bloque login`** — `--api-key <key> --origin <origin> --alias <alias>` for backend auth, `--sandbox` for sandbox.

**`bloque mcp`** — `--http` for HTTP transport, `--port <port>` to set port (default 3100).

## Manual Setup

If you'd rather configure manually:

1. Log in:

```bash
npx @bloque/cli login
```

2. Add this to your agent's MCP config file:

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

3. Restart your agent.

## Tools Reference

<details>
<summary>Workflows — 12 high-level tools (click to expand)</summary>

| Tool | What it does |
|------|-------------|
| `get_profile` | Your identity and KYC status |
| `verify_identity` | Start or check KYC verification |
| `create_account` | Create a pocket + Polygon address |
| `create_card` | Full card setup with optional spending restrictions and funding |
| `create_disposable_card` | One-time card with exact funded amount |
| `fund_card` | Top up a card |
| `topup_via_pse` | Load COP via PSE bank transfer |
| `cashout_to_bank` | Cash out USD to a Colombian bank |
| `configure_spending_rules` | Route transactions to different accounts by merchant type |
| `add_spending_category` | Add a spending category to a card |
| `wallet_overview` | All accounts, balances, and recent transactions |
| `card_summary` | Everything about a specific card |

</details>

<details>
<summary>Primitives — 26 low-level tools (click to expand)</summary>

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

</details>

<details>
<summary>Spending categories (click to expand)</summary>

Restrict cards with friendly names — no need to memorize MCC codes:

| Category | Examples |
|----------|---------|
| `food` | Grocery, restaurants, fast food |
| `transport` | Taxis, rideshare, gas, transit |
| `ads` | Advertising, SaaS |
| `entertainment` | Movies, streaming, events |
| `health` | Pharmacies, doctors, dentists |
| `shopping` | Department stores, clothing |
| `travel` | Airlines, hotels |
| `subscriptions` | Digital goods, streaming, games |

</details>

## Requirements

- Node.js 22+ or Bun 1+
- A [Bloque](https://www.bloque.app) account

## License

MIT
