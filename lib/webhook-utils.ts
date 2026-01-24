/**
 * Webhook Utilities
 *
 * Utilities for generating webhook secrets and building webhook URLs.
 */

import { randomBytes } from 'crypto';

/**
 * Generate a secure random webhook secret.
 * Uses crypto.randomBytes for cryptographically secure random values.
 * Returns a 32-character hex string.
 */
export function generateWebhookSecret(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Build a webhook URL for a workflow.
 *
 * @param workflowId - The workflow ID
 * @param webhookSecret - The webhook secret for authentication
 * @returns The full webhook URL
 */
export function buildWebhookUrl(workflowId: number, webhookSecret: string): string {
  const host = process.env.HOST || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${host}/api/workflow/${workflowId}/execute?secret=${webhookSecret}`;
}

/**
 * Validate a webhook secret against the expected value.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param providedSecret - The secret provided in the request
 * @param expectedSecret - The expected secret from the database
 * @returns True if secrets match, false otherwise
 */
export function validateWebhookSecret(providedSecret: string | null, expectedSecret: string | null): boolean {
  if (!providedSecret || !expectedSecret) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (providedSecret.length !== expectedSecret.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < providedSecret.length; i++) {
    result |= providedSecret.charCodeAt(i) ^ expectedSecret.charCodeAt(i);
  }

  return result === 0;
}
