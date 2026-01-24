/**
 * Email Integration Executor (Server-Side Only)
 *
 * This file contains the server-side execution logic for the email integration.
 * It should only be imported in server-side code (API routes, server components).
 */

import { ExecutionContext, IntegrationResult } from '../types';
import { EmailConfig } from '../definitions/email';

/**
 * Execute the email integration
 */
export async function executeEmail(
  config: EmailConfig,
  context: ExecutionContext
): Promise<IntegrationResult> {
  const { logger } = context;
  const endTimer = logger.startTimer('email_send');

  logger.info('Starting email send', {
    recipientCount: config.to.length,
    hasSubject: !!config.subject,
    hasMessage: !!config.message,
  });

  // Dynamically import to avoid bundling issues
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Substitute variables in all fields
  const to = config.to.map(recipient => context.substituteVariables(recipient));
  const subject = context.substituteVariables(config.subject || 'Workflow Notification');
  const message = context.substituteVariables(config.message || '');
  const from = config.from
    ? context.substituteVariables(config.from)
    : process.env.RESEND_FROM_EMAIL || 'noreply@zeitflow.io';

  logger.debug('Variables substituted', {
    to,
    subject,
    from,
    messageLength: message.length,
  });

  // Validate we have recipients
  if (to.length === 0) {
    logger.error('No recipients specified');
    endTimer();
    return { success: false, error: 'No recipients specified' };
  }

  try {
    logger.debug('Calling Resend API');
    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      text: message,
    });

    endTimer();

    if (error) {
      logger.error('Resend API error', { error: error.message });
      return {
        success: false,
        error: error.message,
        data: { status: 'failed', error: error.message },
      };
    }

    logger.info('Email sent successfully', { to, subject });
    return {
      success: true,
      data: { status: 'sent' },
    };
  } catch (err) {
    endTimer();
    const errorMessage = err instanceof Error ? err.message : 'Failed to send email';
    logger.error('Email send failed', { error: errorMessage });
    return {
      success: false,
      error: errorMessage,
      data: { status: 'failed', error: errorMessage },
    };
  }
}
