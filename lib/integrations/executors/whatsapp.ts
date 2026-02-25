/**
 * WhatsApp Integration Executor (Server-Side Only)
 *
 * This file contains the server-side execution logic for the WhatsApp integration.
 * Uses Twilio's WhatsApp Business API to send messages.
 * It should only be imported in server-side code (API routes, server components).
 */

import { ExecutionContext, IntegrationResult } from '../types';
import { WhatsAppConfig } from '../definitions/whatsapp';

/**
 * E.164 phone number validation regex
 */
const E164_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * Execute the WhatsApp integration
 */
export async function executeWhatsApp(
  config: WhatsAppConfig,
  context: ExecutionContext
): Promise<IntegrationResult> {
  const { logger } = context;
  const endTimer = logger.startTimer('whatsapp_send');

  logger.info('Starting WhatsApp send', {
    recipientCount: config.to.length,
    hasMessage: !!config.message,
    hasCustomCredentials: !!(config.twilioAccountSid && config.twilioAuthToken),
  });

  // Determine which Twilio credentials to use (per-workflow or system)
  const accountSid = config.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = config.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = config.twilioPhoneNumber || process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER;

  // Validate Twilio credentials
  if (!accountSid || !authToken || !phoneNumber) {
    logger.error('Twilio credentials not configured');
    endTimer();
    return {
      success: false,
      error: 'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_NUMBER (or TWILIO_PHONE_NUMBER) environment variables or provide them in the node config.',
      data: { status: 'failed', error: 'Missing credentials' },
    };
  }

  // Dynamic import
  const twilio = (await import('twilio')).default;
  const twilioClient = twilio(accountSid, authToken);

  // Substitute variables
  const recipients = config.to.map(recipient => context.substituteVariables(recipient.trim()));
  const message = context.substituteVariables(config.message || '');

  logger.debug('Variables substituted', {
    recipients,
    messageLength: message.length,
  });

  // Validate we have recipients
  if (recipients.length === 0) {
    logger.error('No recipients specified');
    endTimer();
    return {
      success: false,
      error: 'No recipients specified',
      data: { status: 'failed', error: 'No recipients' },
    };
  }

  // Validate phone numbers
  const invalidNumbers = recipients.filter(num => !E164_REGEX.test(num));
  if (invalidNumbers.length > 0) {
    logger.error('Invalid phone number format', { invalidNumbers });
    endTimer();
    return {
      success: false,
      error: `Invalid phone number format: ${invalidNumbers.join(', ')}. Use E.164 format (e.g., +12345678900)`,
      data: { status: 'failed', error: 'Invalid phone format', invalidNumbers },
    };
  }

  // Send to all recipients in parallel via WhatsApp
  logger.debug('Sending WhatsApp messages', { count: recipients.length });
  const results = await Promise.allSettled(
    recipients.map(async recipient => {
      logger.debug('Sending to recipient', { recipient: recipient.slice(0, 6) + '****' });
      return twilioClient.messages.create({
        body: message,
        from: `whatsapp:${phoneNumber}`,
        to: `whatsapp:${recipient}`,
      });
    })
  );

  // Count results
  const fulfilled = results.filter(r => r.status === 'fulfilled');
  const rejected = results.filter(r => r.status === 'rejected');

  endTimer();

  if (rejected.length === results.length) {
    // All failed
    const errorMessages = rejected
      .map(r => (r as PromiseRejectedResult).reason?.message || 'Unknown error')
      .join('; ');
    logger.error('All WhatsApp sends failed', {
      errorMessages,
      failedCount: rejected.length,
    });
    return {
      success: false,
      error: `Failed to send WhatsApp messages: ${errorMessages}`,
      data: {
        status: 'failed',
        error: errorMessages,
        sentCount: 0,
        failedCount: rejected.length,
      },
    };
  }

  if (rejected.length > 0) {
    // Partial success
    const errorMessages = rejected
      .map(r => (r as PromiseRejectedResult).reason?.message || 'Unknown error')
      .join('; ');
    logger.warn('Some WhatsApp sends failed', {
      sentCount: fulfilled.length,
      failedCount: rejected.length,
      errorMessages,
    });
    return {
      success: true,
      error: `Some messages failed: ${errorMessages}`,
      data: {
        status: 'partial',
        error: errorMessages,
        sentCount: fulfilled.length,
        failedCount: rejected.length,
      },
    };
  }

  // All successful
  logger.info('All WhatsApp messages sent successfully', {
    sentCount: fulfilled.length,
  });
  return {
    success: true,
    data: {
      status: 'sent',
      sentCount: fulfilled.length,
      failedCount: 0,
    },
  };
}
