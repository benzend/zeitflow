/**
 * Email Integration Executor (Server-Side Only)
 *
 * Supports two providers:
 * - Resend (default): Simple API-based email sending
 * - SMTP: Universal provider support (SendGrid, Mailgun, AWS SES, etc.)
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

  const provider = config.provider || 'resend';

  logger.info('Starting email send', {
    provider,
    recipientCount: config.to.length,
    hasSubject: !!config.subject,
    hasMessage: !!config.message,
  });

  // Substitute variables in shared fields
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

  if (provider === 'smtp') {
    return sendViaSMTP(config, { to, subject, message, from }, logger, endTimer);
  }

  return sendViaResend(config, { to, subject, message, from }, logger, endTimer);
}

interface EmailFields {
  to: string[];
  subject: string;
  message: string;
  from: string;
}

async function sendViaResend(
  config: EmailConfig,
  fields: EmailFields,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const apiKey = config.resendApiKey || process.env.RESEND_API_KEY;

  if (!apiKey) {
    logger.error('Resend API key not configured');
    endTimer();
    return {
      success: false,
      error: 'Resend API key not configured. Set RESEND_API_KEY env var or provide your own key in the node config.',
      data: { status: 'failed', error: 'Missing API key', provider: 'resend' },
    };
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    logger.debug('Calling Resend API');
    const { error } = await resend.emails.send({
      from: fields.from,
      to: fields.to,
      subject: fields.subject,
      text: fields.message,
    });

    endTimer();

    if (error) {
      logger.error('Resend API error', { error: error.message });
      return {
        success: false,
        error: error.message,
        data: { status: 'failed', error: error.message, provider: 'resend' },
      };
    }

    logger.info('Email sent via Resend', { to: fields.to, subject: fields.subject });
    return {
      success: true,
      data: { status: 'sent', provider: 'resend' },
    };
  } catch (err) {
    endTimer();
    const errorMessage = err instanceof Error ? err.message : 'Failed to send email';
    logger.error('Resend send failed', { error: errorMessage });
    return {
      success: false,
      error: errorMessage,
      data: { status: 'failed', error: errorMessage, provider: 'resend' },
    };
  }
}

async function sendViaSMTP(
  config: EmailConfig,
  fields: EmailFields,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const host = config.smtpHost;
  const port = config.smtpPort || 587;
  const user = config.smtpUser;
  const pass = config.smtpPass;

  if (!host || !user || !pass) {
    logger.error('SMTP credentials incomplete');
    endTimer();
    return {
      success: false,
      error: 'SMTP credentials incomplete. Provide host, username, and password in the node config.',
      data: { status: 'failed', error: 'Missing SMTP credentials', provider: 'smtp' },
    };
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    logger.debug('Sending via SMTP', { host, port });

    await transporter.sendMail({
      from: fields.from,
      to: fields.to.join(', '),
      subject: fields.subject,
      text: fields.message,
    });

    endTimer();
    logger.info('Email sent via SMTP', { host, to: fields.to, subject: fields.subject });
    return {
      success: true,
      data: { status: 'sent', provider: 'smtp' },
    };
  } catch (err) {
    endTimer();
    const errorMessage = err instanceof Error ? err.message : 'Failed to send email via SMTP';
    logger.error('SMTP send failed', { error: errorMessage });
    return {
      success: false,
      error: errorMessage,
      data: { status: 'failed', error: errorMessage, provider: 'smtp' },
    };
  }
}
