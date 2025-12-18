# Bloque Payments SDK

The official TypeScript/JavaScript SDK for integrating [Bloque](https://www.bloque.app) payments into your applications.

## Features

- **TypeScript First**: Built with TypeScript for complete type safety
- **Simple API**: Intuitive interface for creating and managing checkouts
- **Multiple Payment Methods**: Support for cards, PSE, and cash payments
- **Fully Async**: Promise-based API for modern JavaScript workflows
- **Lightweight**: Minimal dependencies for optimal bundle size

## Installation

```bash
bun add @bloque/payments
```

## Quick Start

```typescript
import { Bloque, type PaymentSubmitPayload } from '@bloque/payments';

// Initialize the SDK (server-side only)
const bloque = new Bloque({
  apiKey: process.env.BLOQUE_API_KEY!,
  server: 'production', // or 'sandbox' for testing
});

app.post('/api/payments', async (req, res) => {
  try {
    const payload: PaymentSubmitPayload = req.body;

    // Create payment using SDK
    const payment = await bloque.payments.create({
      payment: payload,
    });

    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## Configuration

### Initialize the SDK

```typescript
import { Bloque } from '@bloque/payments';

const bloque = new Bloque({
  apiKey: 'your-api-key-here',    // Required: Your Bloque API key
  server: 'sandbox',               // Required: 'sandbox' or 'production'
});
```

### Environment Options

- **`sandbox`**: For testing and development
- **`production`**: For live payments

## API Reference

### Payments

The payments resource allows you to create payments for existing checkout sessions.

#### Create a Payment

```typescript
const payment = await bloque.payments.create({
  checkoutId: string;        // Required: Checkout ID from an existing checkout
  payment: {
    type: 'card' | 'pse' | 'cash',
    data: {
      // Payment method specific data
    }
  }
});
```

**Payment Types**:

**Card Payment**:
```typescript
{
  type: 'card',
  data: {
    cardNumber: string;        // 16-digit card number
    cardholderName: string;    // Name on the card
    expiryMonth: string;       // MM format
    expiryYear: string;        // YY or YYYY format
    cvv: string;               // 3-4 digit CVV
    email?: string;            // Optional customer email
  }
}
```

**PSE Payment** (Colombian online banking):
```typescript
{
  type: 'pse',
  data: {
    personType: 'natural' | 'juridica';  // Person type
    documentType: string;                 // Document type (e.g., 'CC', 'NIT')
    documentNumber: string;               // Document number
    bankCode: string;                     // Bank code
    email: string;                        // Customer email
  }
}
```

**Cash Payment**:
```typescript
{
  type: 'cash',
  data: {
    email: string;            // Customer email
    documentType: string;     // Document type
    documentNumber: string;   // Document number
    fullName: string;         // Full name
  }
}
```

**Payment Response**:
```typescript
{
  id: string;                       // Payment ID
  object: 'payment';                // Object type
  status: 'pending' | 'processing' | 'completed' | 'failed';
  checkout: Checkout;               // Associated checkout
  payment_method: 'card' | 'pse' | 'cash';
  amount: number;                   // Payment amount
  currency: string;                 // Currency
  created_at: string;               // Creation timestamp
  updated_at: string;               // Last update timestamp
}
```

### Checkout

The checkout resource allows you to create payment sessions.

#### Create a Checkout

```typescript
const checkout = await bloque.checkout.create({
  name: string;              // Required: Name of the checkout
  description?: string;      // Optional: Description
  image_url?: string;        // Optional: Product/checkout image URL
  items: CheckoutItem[];     // Required: Items to be purchased
  success_url: string;       // Required: Redirect URL after success
  cancel_url: string;        // Required: Redirect URL after cancellation
  metadata?: Record<string, string | number | boolean>; // Optional: Custom metadata
  expires_at?: string;       // Optional: Expiration date (ISO 8601)
});
```

**Checkout Item**:
```typescript
{
  name: string;        // Item name
  amount: number;      // Price in smallest currency unit (e.g., cents)
  quantity: number;    // Quantity
  image_url?: string;  // Item image URL
}
```

#### Checkout Response

```typescript
{
  id: string;                // Unique checkout identifier
  object: 'checkout';        // Object type
  url: string;               // Public payment URL for the customer
  status: string;            // Current checkout status
  amount_total: number;      // Total amount
  amount_subtotal: number;   // Subtotal amount
  currency: 'USD';           // Currency
  items: CheckoutItem[];     // Items in the checkout
  metadata?: Metadata;       // Custom metadata
  created_at: string;        // Creation timestamp (ISO 8601)
  updated_at: string;        // Last update timestamp (ISO 8601)
  expires_at: string;        // Expiration timestamp (ISO 8601)
}
```

#### Retrieve a Checkout

Retrieve the details of an existing checkout by its ID.

```typescript
const checkout = await bloque.checkout.retrieve('checkout_id_here');
```

**Parameters**:
- `checkoutId` (string): The ID of the checkout to retrieve

**Returns**: A `Checkout` object with all the checkout details.

#### Cancel a Checkout

Cancel an existing checkout that hasn't been completed yet.

```typescript
const checkout = await bloque.checkout.cancel('checkout_id_here');
```

**Parameters**:
- `checkoutId` (string): The ID of the checkout to cancel

**Returns**: A `Checkout` object with updated status reflecting the cancellation.

## Examples

### Processing Payments

```typescript
import { Bloque, type PaymentSubmitPayload } from '@bloque/payments';

// Initialize SDK with your API key
const bloque = new Bloque({
  apiKey: process.env.BLOQUE_API_KEY!,
  server: 'production',
});

// API endpoint handler
app.post('/api/payments', async (req, res) => {
  try {
    // Receive payment data from frontend
    const payload: PaymentSubmitPayload = req.body;

    // Create payment using SDK
    const payment = await bloque.payments.create({
      payment: payload,
    });

    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Payment Methods Examples

#### Card Payment

```typescript
// Receive payload from frontend
const cardPayment: PaymentSubmitPayload = req.body;
// Example payload:
// {
//   type: 'card',
//   data: {
//     cardNumber: '4111111111111111',
//     cardholderName: 'John Doe',
//     expiryMonth: '12',
//     expiryYear: '2025',
//     cvv: '123',
//     email: 'john@example.com'
//   }
// }

const payment = await bloque.payments.create({
  payment: cardPayment,
});
```

#### PSE Payment (Colombian online banking)

```typescript
// Receive payload from frontend
const psePayment: PaymentSubmitPayload = req.body;
// Example payload:
// {
//   type: 'pse',
//   data: {
//     personType: 'natural',
//     documentType: 'CC',
//     documentNumber: '1234567890',
//     bankCode: '1022',
//     email: 'maria@example.com'
//   }
// }

const payment = await bloque.payments.create({
  payment: psePayment,
});
```

#### Cash Payment

```typescript
// Receive payload from frontend
const cashPayment: PaymentSubmitPayload = req.body;
// Example payload:
// {
//   type: 'cash',
//   data: {
//     email: 'carlos@example.com',
//     documentType: 'CC',
//     documentNumber: '9876543210',
//     fullName: 'Carlos García'
//   }
// }

const payment = await bloque.payments.create({
  payment: cashPayment,
});
```

### Type-Safe Payment Creation

The `PaymentSubmitPayload` type is a discriminated union that provides automatic type narrowing:

```typescript
// Backend API handler
async function handlePayment(payload: PaymentSubmitPayload) {
  // TypeScript automatically narrows the type based on the 'type' field
  switch (payload.type) {
    case 'card':
      // payload.data is CardPaymentFormData
      console.log('Processing card ending in:', payload.data.cardNumber.slice(-4));
      break;

    case 'pse':
      // payload.data is PSEPaymentFormData
      console.log('Processing PSE for bank:', payload.data.bankCode);
      break;

    case 'cash':
      // payload.data is CashPaymentFormData
      console.log('Processing cash payment for:', payload.data.fullName);
      break;
  }

  // Create payment using SDK
  return await bloque.payments.create({
    payment: payload,
  });
}
```

### Basic Checkout with Single Item

```typescript
const checkout = await bloque.checkout.create({
  name: 'E-book Purchase',
  description: 'Learn TypeScript in 30 Days',
  items: [
    {
      name: 'TypeScript E-book',
      amount: 19_99,
      quantity: 1,
    },
  ],
  success_url: 'https://yourapp.com/success',
  cancel_url: 'https://yourapp.com/cancel',
});
```

### Checkout with Multiple Items

```typescript
const checkout = await bloque.checkout.create({
  name: 'Shopping Cart',
  description: 'Your selected items',
  items: [
    {
      name: 'Wireless Mouse',
      amount: 25_00,
      quantity: 1,
      image_url: 'https://example.com/mouse.jpg',
    },
    {
      name: 'USB Cable',
      amount: 10_00,
      quantity: 2,
      image_url: 'https://example.com/cable.jpg',
    },
  ],
  success_url: 'https://yourapp.com/success',
  cancel_url: 'https://yourapp.com/cancel',
});
```

### Checkout with Metadata and Expiration

```typescript
const checkout = await bloque.checkout.create({
  name: 'Limited Time Offer',
  items: [
    {
      name: 'Premium Course',
      amount: 99_00,
      quantity: 1,
    },
  ],
  success_url: 'https://yourapp.com/success',
  cancel_url: 'https://yourapp.com/cancel',
  metadata: {
    user_id: '12345',
    campaign: 'summer_sale',
    discount_applied: true,
  },
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
});
```


## Error Handling

The SDK uses standard JavaScript errors. Always wrap API calls in try-catch blocks:

```typescript
try {
  const checkout = await bloque.checkout.create({
    name: 'Product',
    items: [{ name: 'Item', amount: 1000, quantity: 1 }],
    success_url: 'https://yourapp.com/success',
    cancel_url: 'https://yourapp.com/cancel',
  });
} catch (error) {
  console.error('Failed to create checkout:', error);
}
```

## TypeScript Support

This SDK is written in TypeScript and includes complete type definitions. You'll get full autocomplete and type checking when using TypeScript or modern editors like VS Code:

```typescript
import type {
  // Payment types
  PaymentSubmitPayload,
  PaymentResponse,
  CreatePaymentParams,
  // Checkout types
  Checkout,
  CheckoutStatus,
  CheckoutItem,
  CheckoutParams,
} from '@bloque/payments';

const item: CheckoutItem = {
  name: 'Product',
  amount: 5000,
  quantity: 1,
};

// Type-safe payment data
const cardPayment: PaymentSubmitPayload = {
  type: 'card',
  data: {
    cardNumber: '4111111111111111',
    cardholderName: 'John Doe',
    expiryMonth: '12',
    expiryYear: '2025',
    cvv: '123',
  },
};
```

**Discriminated Union Types**:

The SDK uses TypeScript discriminated unions for payment types, which enables automatic type narrowing:

```typescript
// Backend API handler
async function handlePaymentFromFrontend(payment: PaymentSubmitPayload) {
  switch (payment.type) {
    case 'card':
      // TypeScript knows payment.data is CardPaymentFormData
      console.log('Card payment for:', payment.data.cardholderName);
      break;
    case 'pse':
      // TypeScript knows payment.data is PSEPaymentFormData
      console.log('PSE payment, bank:', payment.data.bankCode);
      break;
    case 'cash':
      // TypeScript knows payment.data is CashPaymentFormData
      console.log('Cash payment for:', payment.data.fullName);
      break;
  }

  return await bloque.payments.create({ payment });
}
```

## Development

### Building the SDK

```bash
bun install
bun run build
```

### Development Mode (Watch)

```bash
bun run dev
```

### Type Checking

```bash
bun run typecheck
```

### Code Quality

```bash
bun run check
```

## Requirements

- Node.js 22.x or higher / Bun 1.x or higher
- TypeScript 5.x or higher (for TypeScript projects)

## Links

- [Homepage](https://www.bloque.app)
- [GitHub Repository](git+https://github.com/bloque-app/bloque-payments.git)
- [Issue Tracker](git+https://github.com/bloque-app/bloque-payments.git/issues)

## License

[MIT](../../LICENSE)

