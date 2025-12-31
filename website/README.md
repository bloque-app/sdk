# Bloque Payments Documentation

Official documentation for Bloque Payments SDK and React components.

## Overview

This documentation covers:

- **@bloque/payments-sdk**: Node.js SDK for payment processing
- **@bloque/payments-react**: React components for payment forms

## Languages

The documentation is available in:

- English (`/en`)
- Spanish (`/es`)

## Setup

Install the dependencies:

```bash
npm install
```

## Get started

Start the dev server:

```bash
npm run dev
```

The documentation will be available at `http://localhost:3001`

Build the website for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Documentation Structure

```
docs/
├── en/                     # English documentation
│   ├── guide/             # Getting started guide
│   ├── sdk/               # Node.js SDK documentation
│   ├── react/             # React components documentation
│   └── examples/          # Code examples
└── es/                     # Spanish documentation
    ├── guide/             # Guía de inicio
    ├── sdk/               # Documentación del SDK de Node.js
    ├── react/             # Documentación de componentes React
    └── examples/          # Ejemplos de código
```

## Content

### Getting Started
- Installation guide
- Quick start examples
- Payment flow overview
- Supported payment methods

### SDK (Node.js)
- Overview and installation
- Checkout resource (create, retrieve, cancel)
- Payment resource (card, PSE, cash)
- Error handling
- Complete API reference

### React
- Overview and installation
- BloqueCheckout component
- Customization and theming
- Integration examples

### Examples
- Express.js integration
- Next.js integration
- E-commerce checkout flow
- Testing examples

## Technology

Built with [Rspress](https://rspress.dev/) - Fast documentation generator
