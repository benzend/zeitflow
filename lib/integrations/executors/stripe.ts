/**
 * Stripe Integration Executor (Server-Side Only)
 *
 * This file contains the server-side execution logic for the Stripe integration.
 * Uses Stripe REST API directly (no SDK dependency).
 * It should only be imported in server-side code (API routes, server components).
 */

import { ExecutionContext, IntegrationResult } from '../types';
import { StripeConfig } from '../definitions/stripe';

const STRIPE_API = 'https://api.stripe.com/v1';

/**
 * Make a Stripe API request with form-encoded body
 */
async function stripeRequest(
  secretKey: string,
  method: string,
  path: string,
  body?: Record<string, string>
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${secretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const fetchOptions: RequestInit = { method, headers };
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    fetchOptions.body = new URLSearchParams(body).toString();
  }

  const response = await fetch(`${STRIPE_API}${path}`, fetchOptions);
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

/**
 * Execute the Stripe integration
 */
export async function executeStripe(
  config: StripeConfig,
  context: ExecutionContext
): Promise<IntegrationResult> {
  const { logger } = context;
  const endTimer = logger.startTimer('stripe_execute');

  logger.info('Starting Stripe operation', {
    action: config.action,
  });

  const secretKey = config.secretKey || process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    logger.error('Stripe secret key not configured');
    endTimer();
    return {
      success: false,
      error: 'Stripe secret key not configured. Set STRIPE_SECRET_KEY env var or provide it in the node config.',
      data: { status: 'failed', error: 'Missing secret key' },
    };
  }

  try {
    switch (config.action) {
      case 'create_customer':
        return await createCustomer(config, secretKey, context, logger, endTimer);
      case 'create_invoice':
        return await createInvoice(config, secretKey, context, logger, endTimer);
      case 'create_payment_link':
        return await createPaymentLink(config, secretKey, context, logger, endTimer);
      case 'list_customers':
        return await listCustomers(config, secretKey, context, logger, endTimer);
      case 'list_invoices':
        return await listInvoices(config, secretKey, context, logger, endTimer);
      case 'retrieve_balance':
        return await retrieveBalance(secretKey, logger, endTimer);
      default:
        logger.error('Unknown action', { action: config.action });
        endTimer();
        return {
          success: false,
          error: `Unknown Stripe action: ${config.action}`,
          data: { status: 'failed', error: 'Unknown action' },
        };
    }
  } catch (error) {
    endTimer();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Stripe operation failed', { error: errorMessage });
    return {
      success: false,
      error: `Stripe operation failed: ${errorMessage}`,
      data: { status: 'failed', error: errorMessage },
    };
  }
}

async function createCustomer(
  config: StripeConfig,
  secretKey: string,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const email = context.substituteVariables(config.email || '');
  const name = context.substituteVariables(config.name || '');
  const description = context.substituteVariables(config.description || '');

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

  const body: Record<string, string> = { email };
  if (name) body.name = name;
  if (description) body.description = description;

  const result = await stripeRequest(secretKey, 'POST', '/customers', body);

  if (!result.ok) {
    const error = result.data.error as Record<string, unknown>;
    const msg = (error?.message as string) || `HTTP ${result.status}`;
    logger.error('Stripe API error', { status: result.status, error: msg });
    endTimer();
    return {
      success: false,
      error: `Stripe API error: ${msg}`,
      data: { status: 'failed', error: msg },
    };
  }

  endTimer();
  logger.info('Customer created', { customerId: result.data.id });

  return {
    success: true,
    data: {
      status: 'created',
      customerId: result.data.id as string,
    },
  };
}

async function createInvoice(
  config: StripeConfig,
  secretKey: string,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const customerId = context.substituteVariables(config.customerId || '');
  const amount = context.substituteVariables(config.amount || '');
  const description = context.substituteVariables(config.invoiceDescription || '');

  if (!customerId) {
    logger.error('No customer ID specified');
    endTimer();
    return {
      success: false,
      error: 'Customer ID is required to create an invoice',
      data: { status: 'failed', error: 'Missing customer ID' },
    };
  }

  if (!amount) {
    logger.error('No amount specified');
    endTimer();
    return {
      success: false,
      error: 'Amount is required to create an invoice',
      data: { status: 'failed', error: 'Missing amount' },
    };
  }

  logger.debug('Creating invoice', { customerId, amount, currency: config.currency });

  // Create invoice
  const invoiceResult = await stripeRequest(secretKey, 'POST', '/invoices', {
    customer: customerId,
    'auto_advance': 'true',
  });

  if (!invoiceResult.ok) {
    const error = invoiceResult.data.error as Record<string, unknown>;
    const msg = (error?.message as string) || `HTTP ${invoiceResult.status}`;
    logger.error('Stripe API error creating invoice', { error: msg });
    endTimer();
    return {
      success: false,
      error: `Stripe API error: ${msg}`,
      data: { status: 'failed', error: msg },
    };
  }

  const invoiceId = invoiceResult.data.id as string;

  // Add line item
  const lineBody: Record<string, string> = {
    invoice: invoiceId,
    amount,
    currency: config.currency || 'usd',
  };
  if (description) lineBody.description = description;

  const lineResult = await stripeRequest(secretKey, 'POST', '/invoiceitems', lineBody);

  if (!lineResult.ok) {
    const error = lineResult.data.error as Record<string, unknown>;
    const msg = (error?.message as string) || `HTTP ${lineResult.status}`;
    logger.error('Stripe API error adding line item', { error: msg });
    endTimer();
    return {
      success: false,
      error: `Stripe API error adding line item: ${msg}`,
      data: { status: 'failed', error: msg },
    };
  }

  // Finalize invoice
  const finalizeResult = await stripeRequest(secretKey, 'POST', `/invoices/${invoiceId}/finalize`);

  if (!finalizeResult.ok) {
    const error = finalizeResult.data.error as Record<string, unknown>;
    const msg = (error?.message as string) || `HTTP ${finalizeResult.status}`;
    logger.error('Stripe API error finalizing invoice', { error: msg });
    endTimer();
    return {
      success: false,
      error: `Stripe API error finalizing: ${msg}`,
      data: { status: 'failed', error: msg, invoiceId },
    };
  }

  endTimer();
  const invoiceUrl = finalizeResult.data.hosted_invoice_url as string;
  logger.info('Invoice created and finalized', { invoiceId, invoiceUrl });

  return {
    success: true,
    data: {
      status: 'created',
      invoiceId,
      invoiceUrl,
    },
  };
}

async function createPaymentLink(
  config: StripeConfig,
  secretKey: string,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const amount = context.substituteVariables(config.amount || '');
  const productName = context.substituteVariables(config.productName || 'Payment');

  if (!amount) {
    logger.error('No amount specified');
    endTimer();
    return {
      success: false,
      error: 'Amount is required to create a payment link',
      data: { status: 'failed', error: 'Missing amount' },
    };
  }

  logger.debug('Creating payment link', { amount, currency: config.currency, productName });

  // Create a price (inline product)
  const priceResult = await stripeRequest(secretKey, 'POST', '/prices', {
    'unit_amount': amount,
    currency: config.currency || 'usd',
    'product_data[name]': productName,
  });

  if (!priceResult.ok) {
    const error = priceResult.data.error as Record<string, unknown>;
    const msg = (error?.message as string) || `HTTP ${priceResult.status}`;
    logger.error('Stripe API error creating price', { error: msg });
    endTimer();
    return {
      success: false,
      error: `Stripe API error: ${msg}`,
      data: { status: 'failed', error: msg },
    };
  }

  const priceId = priceResult.data.id as string;

  // Create payment link
  const linkResult = await stripeRequest(secretKey, 'POST', '/payment_links', {
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
  });

  if (!linkResult.ok) {
    const error = linkResult.data.error as Record<string, unknown>;
    const msg = (error?.message as string) || `HTTP ${linkResult.status}`;
    logger.error('Stripe API error creating payment link', { error: msg });
    endTimer();
    return {
      success: false,
      error: `Stripe API error: ${msg}`,
      data: { status: 'failed', error: msg },
    };
  }

  endTimer();
  const paymentLinkUrl = linkResult.data.url as string;
  logger.info('Payment link created', { paymentLinkUrl });

  return {
    success: true,
    data: {
      status: 'created',
      paymentLinkUrl,
    },
  };
}

async function listCustomers(
  config: StripeConfig,
  secretKey: string,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const email = context.substituteVariables(config.email || '');
  const query = context.substituteVariables(config.query || '');
  const limit = Math.min(config.limit || 10, 100);

  logger.debug('Listing customers', { email, query, limit });

  let path: string;
  if (query) {
    path = `/customers/search?query=${encodeURIComponent(query)}&limit=${limit}`;
  } else if (email) {
    path = `/customers?email=${encodeURIComponent(email)}&limit=${limit}`;
  } else {
    path = `/customers?limit=${limit}`;
  }

  const result = await stripeRequest(secretKey, 'GET', path);

  if (!result.ok) {
    const error = result.data.error as Record<string, unknown>;
    const msg = (error?.message as string) || `HTTP ${result.status}`;
    logger.error('Stripe API error', { error: msg });
    endTimer();
    return {
      success: false,
      error: `Stripe API error: ${msg}`,
      data: { status: 'failed', error: msg },
    };
  }

  const customers = (result.data.data as Array<Record<string, unknown>>) || [];
  endTimer();
  logger.info('Customers listed', { count: customers.length });

  return {
    success: true,
    data: {
      status: 'listed',
      results: customers.map(c => ({
        id: c.id,
        email: c.email,
        name: c.name,
        created: c.created,
      })),
      resultCount: customers.length,
    },
  };
}

async function listInvoices(
  config: StripeConfig,
  secretKey: string,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const customerId = context.substituteVariables(config.customerId || '');
  const limit = Math.min(config.limit || 10, 100);

  logger.debug('Listing invoices', { customerId, limit });

  let path = `/invoices?limit=${limit}`;
  if (customerId) path += `&customer=${encodeURIComponent(customerId)}`;

  const result = await stripeRequest(secretKey, 'GET', path);

  if (!result.ok) {
    const error = result.data.error as Record<string, unknown>;
    const msg = (error?.message as string) || `HTTP ${result.status}`;
    logger.error('Stripe API error', { error: msg });
    endTimer();
    return {
      success: false,
      error: `Stripe API error: ${msg}`,
      data: { status: 'failed', error: msg },
    };
  }

  const invoices = (result.data.data as Array<Record<string, unknown>>) || [];
  endTimer();
  logger.info('Invoices listed', { count: invoices.length });

  return {
    success: true,
    data: {
      status: 'listed',
      results: invoices.map(i => ({
        id: i.id,
        status: i.status,
        total: i.total,
        currency: i.currency,
        customer: i.customer,
        hostedInvoiceUrl: i.hosted_invoice_url,
      })),
      resultCount: invoices.length,
    },
  };
}

async function retrieveBalance(
  secretKey: string,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  logger.debug('Retrieving balance');

  const result = await stripeRequest(secretKey, 'GET', '/balance');

  if (!result.ok) {
    const error = result.data.error as Record<string, unknown>;
    const msg = (error?.message as string) || `HTTP ${result.status}`;
    logger.error('Stripe API error', { error: msg });
    endTimer();
    return {
      success: false,
      error: `Stripe API error: ${msg}`,
      data: { status: 'failed', error: msg },
    };
  }

  endTimer();
  logger.info('Balance retrieved');

  return {
    success: true,
    data: {
      status: 'listed',
      results: result.data.available as Array<Record<string, unknown>>,
      resultCount: (result.data.available as Array<Record<string, unknown>>)?.length || 0,
    },
  };
}
