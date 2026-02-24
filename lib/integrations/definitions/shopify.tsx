import React from 'react';
import { z } from 'zod';
import { IntegrationDefinition } from '../types';

/**
 * Shopify icon component
 */
const ShopifyIcon = ({ className, color }: { className?: string; color?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.201-.192s-1.776-.129-1.776-.129-.937-.936-1.172-1.17a.652.652 0 00-.298-.147l-.835 19.03zM11.607 7.48s-.63-.33-1.393-.33c-1.126 0-1.181.706-1.181.885 0 .97 2.534 1.343 2.534 3.621 0 1.793-1.135 2.946-2.665 2.946-1.836 0-2.774-1.14-2.774-1.14l.491-1.62s.964.828 1.779.828c.532 0 .748-.419.748-.726 0-1.268-2.08-1.323-2.08-3.413 0-1.757 1.264-3.457 3.813-3.457 .98 0 1.466.282 1.466.282l-.738 2.124z"
      fill={color || 'currentColor'}
    />
    <path
      d="M14.385 3.148a1.95 1.95 0 00-.42-1.003c-.518-.666-1.263-.982-1.263-.982s-.267-.142-.267-.18c0-.038.212-.018.212-.018s.912.073.912.073l.004-.017c-.1-.01-.2-.025-.302-.034-.147-.012-.267-.01-.34.04-.052.037-.236.184-.236.184s.746.316 1.264.982a1.95 1.95 0 01.42 1.003l-.004-.005c.009.057.015.117.02.177l.173-.122c-.01-.032-.154-1.054-.173-.098z"
      fill={color || 'currentColor'}
      opacity="0.5"
    />
  </svg>
);

/**
 * Zod schema for Shopify configuration
 */
export const ShopifyConfigSchema = z.object({
  action: z.enum(['list_orders', 'get_order', 'list_products', 'create_product', 'list_customers', 'create_customer']).default('list_orders'),
  shopDomain: z.string().default(''),
  accessToken: z.string().optional().default(''),
  orderId: z.string().optional().default(''),
  orderStatus: z.enum(['any', 'open', 'closed', 'cancelled']).default('any'),
  productTitle: z.string().optional().default(''),
  productDescription: z.string().optional().default(''),
  productType: z.string().optional().default(''),
  productVendor: z.string().optional().default(''),
  variantPrice: z.string().optional().default(''),
  variantSku: z.string().optional().default(''),
  customerEmail: z.string().optional().default(''),
  customerFirstName: z.string().optional().default(''),
  customerLastName: z.string().optional().default(''),
  limit: z.number().optional().default(50),
});

export type ShopifyConfig = z.infer<typeof ShopifyConfigSchema>;

/**
 * Shopify integration definition (client-safe metadata only)
 * Execute function is defined in executors/shopify.ts
 */
export const shopifyIntegration: Omit<IntegrationDefinition<typeof ShopifyConfigSchema>, 'execute'> = {
  id: 'shopify',
  name: 'Shopify',
  description: 'Manage orders, products, and customers in Shopify',
  category: 'data',

  icon: ShopifyIcon,
  color: '#96BF48',

  configSchema: ShopifyConfigSchema,
  defaultConfig: {
    action: 'list_orders',
    shopDomain: '',
    accessToken: '',
    orderId: '',
    orderStatus: 'any',
    productTitle: '',
    productDescription: '',
    productType: '',
    productVendor: '',
    variantPrice: '',
    variantSku: '',
    customerEmail: '',
    customerFirstName: '',
    customerLastName: '',
    limit: 50,
  },

  uiConfig: {
    action: {
      hint: 'select',
      label: 'Action',
      options: [
        { value: 'list_orders', label: 'List Orders' },
        { value: 'get_order', label: 'Get Order' },
        { value: 'list_products', label: 'List Products' },
        { value: 'create_product', label: 'Create Product' },
      ],
    },
    shopDomain: {
      hint: 'text',
      label: 'Shop Domain',
      placeholder: 'your-store.myshopify.com',
      supportsVariables: false,
      validationHint: 'Your Shopify store domain (e.g., your-store.myshopify.com). Falls back to SHOPIFY_SHOP_DOMAIN env var.',
    },
    accessToken: {
      hint: 'text',
      label: 'Access Token (optional)',
      placeholder: 'Leave empty to use SHOPIFY_ACCESS_TOKEN env var',
      supportsVariables: false,
      validationHint: 'Admin API access token from a Shopify custom app. Falls back to SHOPIFY_ACCESS_TOKEN env var.',
    },
    orderId: {
      hint: 'text',
      label: 'Order ID',
      placeholder: '5678901234',
      supportsVariables: true,
      validationHint: 'Shopify order ID. Required for Get Order action.',
    },
    orderStatus: {
      hint: 'select',
      label: 'Order Status Filter',
      options: [
        { value: 'any', label: 'Any' },
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    productTitle: {
      hint: 'text',
      label: 'Product Title',
      placeholder: 'My Product',
      supportsVariables: true,
      validationHint: 'Required for Create Product action.',
    },
    productDescription: {
      hint: 'textarea',
      label: 'Product Description',
      placeholder: 'Product description (supports HTML)',
      supportsVariables: true,
    },
    productType: {
      hint: 'text',
      label: 'Product Type',
      placeholder: 'e.g., T-Shirt',
      supportsVariables: true,
    },
    productVendor: {
      hint: 'text',
      label: 'Vendor',
      placeholder: 'Vendor name',
      supportsVariables: true,
    },
    variantPrice: {
      hint: 'text',
      label: 'Price',
      placeholder: '29.99',
      supportsVariables: true,
      validationHint: 'Default variant price in shop currency.',
    },
    variantSku: {
      hint: 'text',
      label: 'SKU',
      placeholder: 'SKU-001',
      supportsVariables: true,
    },
    customerEmail: {
      hint: 'email',
      label: 'Customer Email',
      placeholder: '{{entry.email}}',
      supportsVariables: true,
      validationHint: 'Required for Create Customer.',
    },
    customerFirstName: {
      hint: 'text',
      label: 'First Name',
      placeholder: '{{entry.first_name}}',
      supportsVariables: true,
    },
    customerLastName: {
      hint: 'text',
      label: 'Last Name',
      placeholder: '{{entry.last_name}}',
      supportsVariables: true,
    },
  },

  auth: {
    type: 'api_key',
    envVar: 'SHOPIFY_ACCESS_TOKEN',
  },

  outputVariables: [
    { name: 'status', type: 'string', description: 'Operation status (listed/created/found/failed)' },
    { name: 'orderId', type: 'string', description: 'Order ID' },
    { name: 'productId', type: 'string', description: 'Product ID' },
    { name: 'customerId', type: 'string', description: 'Customer ID' },
    { name: 'results', type: 'object', description: 'Array of results' },
    { name: 'resultCount', type: 'number', description: 'Number of results' },
    { name: 'error', type: 'string', description: 'Error message if failed' },
  ],
};
