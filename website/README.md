# Bloque SDK Documentation

Official documentation for the Bloque SDK.

## Overview

This documentation covers the **@bloque/sdk** - a TypeScript/JavaScript SDK for integrating Bloque services into your applications.

The SDK provides modules for:

- **Organizations** (`@bloque/sdk-orgs`): Organization management
- **Compliance** (`@bloque/sdk-compliance`): KYC/KYB compliance services
- **Accounts** (`@bloque/sdk-accounts`): Account and virtual card management
- **Identity** (`@bloque/sdk-identity`): User identity and authentication
- **Core** (`@bloque/sdk-core`): Base client and shared utilities

## Languages

The documentation is available in:

- English (`/en`)
- Spanish (`/es`)

## Setup

Install the dependencies:

```bash
bun install
```

## Get started

Start the dev server:

```bash
bun run dev
```

The documentation will be available at `http://localhost:5173`

Build the website for production:

```bash
bun run build
```

Preview the production build locally:

```bash
bun run preview
```

## Documentation Structure

```
docs/
├── en/                     # English documentation
│   ├── guide/             # Getting started guide
│   │   ├── start/         # Quick start
│   │   ├── features/      # SDK features
│   │   ├── accounts/      # Account management
│   │   └── examples/      # Code examples
│   └── index.md           # Home page
└── es/                     # Spanish documentation
    ├── guide/             # Guía de inicio
    │   ├── start/         # Inicio rápido
    │   ├── features/      # Características del SDK
    │   ├── accounts/      # Gestión de cuentas
    │   └── examples/      # Ejemplos de código
    └── index.md           # Página de inicio
```

## Content

### Getting Started
- Installation guide
- Quick start examples
- Platform support (Node.js, Bun, Deno, Browser)
- User sessions and authentication

### Features
- Organizations management
- Compliance (KYC/KYB)
- Account management
- Virtual cards
- Identity registration
- User sessions

### Examples
- Backend integration examples
- Virtual card creation
- User registration flows
- Session management

## Technology

Built with [Rspress](https://rspress.dev/) - Fast Rspack-based documentation framework

## Repository

GitHub: [bloque-app/sdk](https://github.com/bloque-app/sdk)
NPM: [@bloque/sdk](https://www.npmjs.com/package/@bloque/sdk)
