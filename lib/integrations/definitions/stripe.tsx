import React from 'react';
import { z } from 'zod';
import { IntegrationDefinition } from '../types';

/**
 * Stripe icon component
 */
const StripeIcon = ({ className, color }: { className?: string; color?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.918 3.757 7.11c0 4.46 2.72 6.326 7.122 7.945 2.828 1.023 3.806 1.77 3.806 2.897 0 .953-.832 1.524-2.387 1.524-2.063 0-4.88-.858-6.888-2.07L4.5 22.9C5.932 23.74 9.096 24 11.971 24c2.6 0 4.743-.63 6.274-1.83 1.677-1.305 2.498-3.216 2.498-5.62 0-4.569-2.774-6.383-6.767-7.9z"
      fill={color || 'currentColor'}
    />
  </svg>
);

/**
 * Zod schema for Stripe configuration
 */
export const StripeConfigSchema = z.object({
  action: z.enum(['create_customer', 'create_invoice', 'create_payment_link', 'list_customers', 'list_invoices', 'retrieve_balance']).default('create_customer'),
  secretKey: z.string().optional().default(''),
  email: z.string().optional().default(''),
  name: z.string().optional().default(''),
  description: z.string().optional().default(''),
  customerId: z.string().optional().default(''),
  amount: z.string().optional().default(''),
  currency: z.string().optional().default('usd'),
  invoiceDescription: z.string().optional().default(''),
  productName: z.string().optional().default(''),
  query: z.string().optional().default(''),
  limit: z.number().optional().default(10),
});

export type StripeConfig = z.infer<typeof StripeConfigSchema>;

/**
 * Stripe integration definition (client-safe metadata only)
 * Execute function is defined in executors/stripe.ts
 */
export const stripeIntegration: Omit<IntegrationDefinition<typeof StripeConfigSchema>, 'execute'> = {
  id: 'stripe',
  name: 'Stripe',
  description: 'Create customers, invoices, and payment links via Stripe',
  category: 'data',

  icon: StripeIcon,
  color: '#635BFF',

  configSchema: StripeConfigSchema,
  defaultConfig: {
    action: 'create_customer',
    secretKey: '',
    email: '',
    name: '',
    description: '',
    customerId: '',
    amount: '',
    currency: 'usd',
    invoiceDescription: '',
    productName: '',
    query: '',
    limit: 10,
  },

  uiConfig: {
    action: {
      hint: 'select',
      label: 'Action',
      options: [
        { value: 'create_customer', label: 'Create Customer' },
        { value: 'create_invoice', label: 'Create Invoice' },
        { value: 'create_payment_link', label: 'Create Payment Link' },
        { value: 'list_customers', label: 'List Customers' },
      ],
    },
    secretKey: {
      hint: 'text',
      label: 'Secret Key (optional)',
      placeholder: 'Leave empty to use STRIPE_SECRET_KEY env var',
      supportsVariables: false,
      validationHint: 'Your Stripe secret key (sk_live_... or sk_test_...). Falls back to STRIPE_SECRET_KEY env var.',
    },
    email: {
      hint: 'email',
      label: 'Customer Email',
      placeholder: '{{entry.email}}',
      supportsVariables: true,
      validationHint: 'Required for creating a customer. Used as search filter for listing.',
    },
    name: {
      hint: 'text',
      label: 'Customer Name',
      placeholder: '{{entry.name}}',
      supportsVariables: true,
    },
    description: {
      hint: 'text',
      label: 'Description',
      placeholder: 'Customer from workflow',
      supportsVariables: true,
    },
    customerId: {
      hint: 'text',
      label: 'Customer ID',
      placeholder: 'cus_...',
      supportsVariables: true,
      validationHint: 'Required for creating invoices. Use {{stripe.customerId}} from a previous Stripe node.',
    },
    amount: {
      hint: 'text',
      label: 'Amount (cents)',
      placeholder: '5000',
      supportsVariables: true,
      validationHint: 'Amount in smallest currency unit (cents for USD). E.g., 5000 = $50.00.',
    },
    currency: {
      hint: 'select',
      label: 'Currency',
      options: [
        { value: 'usd', label: 'USD' },
        { value: 'eur', label: 'EUR' },
        { value: 'gbp', label: 'GBP' },
        { value: 'cad', label: 'CAD' },
        { value: 'aud', label: 'AUD' },
        { value: 'jpy', label: 'JPY' },
      ],
    },
    invoiceDescription: {
      hint: 'text',
      label: 'Invoice Line Item Description',
      placeholder: 'Service fee',
      supportsVariables: true,
    },
    productName: {
      hint: 'text',
      label: 'Product Name',
      placeholder: 'My Product',
      supportsVariables: true,
      validationHint: 'Product name for payment links.',
    },
    query: {
      hint: 'text',
      label: 'Search Query',
      placeholder: 'email~"user@example.com"',
      supportsVariables: true,
      validationHint: 'Stripe search query syntax. Used for listing customers.',
    },
  },

  auth: {
    type: 'api_key',
    envVar: 'STRIPE_SECRET_KEY',
  },

  outputVariables: [
    { name: 'status', type: 'string', description: 'Operation status (created/listed/failed)' },
    { name: 'customerId', type: 'string', description: 'Stripe customer ID' },
    { name: 'invoiceId', type: 'string', description: 'Stripe invoice ID' },
    { name: 'invoiceUrl', type: 'string', description: 'Hosted invoice URL' },
    { name: 'paymentLinkUrl', type: 'string', description: 'Payment link URL' },
    { name: 'results', type: 'object', description: 'Array of results (for list actions)' },
    { name: 'resultCount', type: 'number', description: 'Number of results' },
    { name: 'error', type: 'string', description: 'Error message if failed' },
  ],
};
