/**
 * Shopify Integration Executor (Server-Side Only)
 *
 * This file contains the server-side execution logic for the Shopify integration.
 * Uses Shopify Admin REST API (2024-01).
 * It should only be imported in server-side code (API routes, server components).
 */

import { ExecutionContext, IntegrationResult } from '../types';
import { ShopifyConfig } from '../definitions/shopify';

const API_VERSION = '2024-01';

/**
 * Make a Shopify Admin API request
 */
async function shopifyRequest(
  shopDomain: string,
  accessToken: string,
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const cleanDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const url = `https://${cleanDomain}/admin/api/${API_VERSION}${path}`;

  const headers: Record<string, string> = {
    'X-Shopify-Access-Token': accessToken,
    'Content-Type': 'application/json',
  };

  const fetchOptions: RequestInit = { method, headers };
  if (body && ['POST', 'PUT'].includes(method)) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

/**
 * Execute the Shopify integration
 */
export async function executeShopify(
  config: ShopifyConfig,
  context: ExecutionContext
): Promise<IntegrationResult> {
  const { logger } = context;
  const endTimer = logger.startTimer('shopify_execute');

  logger.info('Starting Shopify operation', {
    action: config.action,
  });

  const shopDomain = config.shopDomain || process.env.SHOPIFY_SHOP_DOMAIN;
  const accessToken = config.accessToken || process.env.SHOPIFY_ACCESS_TOKEN;

  if (!shopDomain || !accessToken) {
    logger.error('Shopify credentials not configured');
    endTimer();
    return {
      success: false,
      error: 'Shopify credentials not configured. Set SHOPIFY_SHOP_DOMAIN and SHOPIFY_ACCESS_TOKEN env vars or provide them in the node config.',
      data: { status: 'failed', error: 'Missing credentials' },
    };
  }

  try {
    switch (config.action) {
      case 'list_orders':
        return await listOrders(config, shopDomain, accessToken, context, logger, endTimer);
      case 'get_order':
        return await getOrder(config, shopDomain, accessToken, context, logger, endTimer);
      case 'list_products':
        return await listProducts(config, shopDomain, accessToken, logger, endTimer);
      case 'create_product':
        return await createProduct(config, shopDomain, accessToken, context, logger, endTimer);
      case 'list_customers':
        return await listCustomers(config, shopDomain, accessToken, logger, endTimer);
      case 'create_customer':
        return await createCustomer(config, shopDomain, accessToken, context, logger, endTimer);
      default:
        logger.error('Unknown action', { action: config.action });
        endTimer();
        return {
          success: false,
          error: `Unknown Shopify action: ${config.action}`,
          data: { status: 'failed', error: 'Unknown action' },
        };
    }
  } catch (error) {
    endTimer();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Shopify operation failed', { error: errorMessage });
    return {
      success: false,
      error: `Shopify operation failed: ${errorMessage}`,
      data: { status: 'failed', error: errorMessage },
    };
  }
}

async function listOrders(
  config: ShopifyConfig,
  shopDomain: string,
  accessToken: string,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const limit = Math.min(config.limit || 50, 250);
  const status = config.orderStatus || 'any';

  logger.debug('Listing orders', { status, limit });

  const result = await shopifyRequest(shopDomain, accessToken, 'GET',
    `/orders.json?status=${status}&limit=${limit}`);

  if (!result.ok) {
    endTimer();
    logger.error('Shopify API error', { status: result.status });
    return {
      success: false,
      error: `Shopify API error: ${result.status}`,
      data: { status: 'failed', error: JSON.stringify(result.data.errors || result.data) },
    };
  }

  const orders = (result.data.orders as Array<Record<string, unknown>>) || [];
  endTimer();
  logger.info('Orders listed', { count: orders.length });

  return {
    success: true,
    data: {
      status: 'listed',
      results: orders.map(o => ({
        id: o.id,
        name: o.name,
        email: o.email,
        totalPrice: o.total_price,
        financialStatus: o.financial_status,
        fulfillmentStatus: o.fulfillment_status,
        createdAt: o.created_at,
      })),
      resultCount: orders.length,
    },
  };
}

async function getOrder(
  config: ShopifyConfig,
  shopDomain: string,
  accessToken: string,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const orderId = context.substituteVariables(config.orderId || '');

  if (!orderId) {
    logger.error('No order ID specified');
    endTimer();
    return {
      success: false,
      error: 'Order ID is required',
      data: { status: 'failed', error: 'Missing order ID' },
    };
  }

  logger.debug('Getting order', { orderId });

  const result = await shopifyRequest(shopDomain, accessToken, 'GET', `/orders/${orderId}.json`);

  if (!result.ok) {
    endTimer();
    logger.error('Shopify API error', { status: result.status });
    return {
      success: false,
      error: `Shopify API error: ${result.status}`,
      data: { status: 'failed', error: JSON.stringify(result.data.errors || result.data) },
    };
  }

  const order = result.data.order as Record<string, unknown>;
  endTimer();
  logger.info('Order retrieved', { orderId: order?.id });

  return {
    success: true,
    data: {
      status: 'found',
      orderId: String(order?.id || ''),
      results: [order],
      resultCount: 1,
    },
  };
}

async function listProducts(
  config: ShopifyConfig,
  shopDomain: string,
  accessToken: string,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const limit = Math.min(config.limit || 50, 250);

  logger.debug('Listing products', { limit });

  const result = await shopifyRequest(shopDomain, accessToken, 'GET', `/products.json?limit=${limit}`);

  if (!result.ok) {
    endTimer();
    logger.error('Shopify API error', { status: result.status });
    return {
      success: false,
      error: `Shopify API error: ${result.status}`,
      data: { status: 'failed', error: JSON.stringify(result.data.errors || result.data) },
    };
  }

  const products = (result.data.products as Array<Record<string, unknown>>) || [];
  endTimer();
  logger.info('Products listed', { count: products.length });

  return {
    success: true,
    data: {
      status: 'listed',
      results: products.map(p => ({
        id: p.id,
        title: p.title,
        vendor: p.vendor,
        productType: p.product_type,
        status: p.status,
        createdAt: p.created_at,
      })),
      resultCount: products.length,
    },
  };
}

async function createProduct(
  config: ShopifyConfig,
  shopDomain: string,
  accessToken: string,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const title = context.substituteVariables(config.productTitle || '');
  const body_html = context.substituteVariables(config.productDescription || '');
  const product_type = context.substituteVariables(config.productType || '');
  const vendor = context.substituteVariables(config.productVendor || '');
  const price = context.substituteVariables(config.variantPrice || '');
  const sku = context.substituteVariables(config.variantSku || '');

  if (!title) {
    logger.error('No product title specified');
    endTimer();
    return {
      success: false,
      error: 'Product title is required',
      data: { status: 'failed', error: 'Missing product title' },
    };
  }

  logger.debug('Creating product', { title });

  const product: Record<string, unknown> = { title };
  if (body_html) product.body_html = body_html;
  if (product_type) product.product_type = product_type;
  if (vendor) product.vendor = vendor;

  if (price || sku) {
    const variant: Record<string, string> = {};
    if (price) variant.price = price;
    if (sku) variant.sku = sku;
    product.variants = [variant];
  }

  const result = await shopifyRequest(shopDomain, accessToken, 'POST', '/products.json', { product });

  if (!result.ok) {
    endTimer();
    logger.error('Shopify API error', { status: result.status });
    return {
      success: false,
      error: `Shopify API error: ${result.status}`,
      data: { status: 'failed', error: JSON.stringify(result.data.errors || result.data) },
    };
  }

  const created = result.data.product as Record<string, unknown>;
  endTimer();
  logger.info('Product created', { productId: created?.id });

  return {
    success: true,
    data: {
      status: 'created',
      productId: String(created?.id || ''),
    },
  };
}

async function listCustomers(
  config: ShopifyConfig,
  shopDomain: string,
  accessToken: string,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const limit = Math.min(config.limit || 50, 250);

  logger.debug('Listing customers', { limit });

  const result = await shopifyRequest(shopDomain, accessToken, 'GET', `/customers.json?limit=${limit}`);

  if (!result.ok) {
    endTimer();
    logger.error('Shopify API error', { status: result.status });
    return {
      success: false,
      error: `Shopify API error: ${result.status}`,
      data: { status: 'failed', error: JSON.stringify(result.data.errors || result.data) },
    };
  }

  const customers = (result.data.customers as Array<Record<string, unknown>>) || [];
  endTimer();
  logger.info('Customers listed', { count: customers.length });

  return {
    success: true,
    data: {
      status: 'listed',
      results: customers.map(c => ({
        id: c.id,
        email: c.email,
        firstName: c.first_name,
        lastName: c.last_name,
        ordersCount: c.orders_count,
        totalSpent: c.total_spent,
      })),
      resultCount: customers.length,
    },
  };
}

async function createCustomer(
  config: ShopifyConfig,
  shopDomain: string,
  accessToken: string,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const email = context.substituteVariables(config.customerEmail || '');
  const firstName = context.substituteVariables(config.customerFirstName || '');
  const lastName = context.substituteVariables(config.customerLastName || '');

  if (!email) {
    logger.error('No email specified for customer');
    endTimer();
    return {
      success: false,
      error: 'Email is required to create a customer',
      data: { status: 'failed', error: 'Missing email' },
    };
  }

  logger.debug('Creating customer', { email });

  const customer: Record<string, string> = { email };
  if (firstName) customer.first_name = firstName;
  if (lastName) customer.last_name = lastName;

  const result = await shopifyRequest(shopDomain, accessToken, 'POST', '/customers.json', { customer });

  if (!result.ok) {
    endTimer();
    logger.error('Shopify API error', { status: result.status });
    return {
      success: false,
      error: `Shopify API error: ${result.status}`,
      data: { status: 'failed', error: JSON.stringify(result.data.errors || result.data) },
    };
  }

  const created = result.data.customer as Record<string, unknown>;
  endTimer();
  logger.info('Customer created', { customerId: created?.id });

  return {
    success: true,
    data: {
      status: 'created',
      customerId: String(created?.id || ''),
    },
  };
}
