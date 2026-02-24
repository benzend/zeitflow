/**
 * Discord Integration Executor (Server-Side Only)
 *
 * This file contains the server-side execution logic for the Discord integration.
 * It should only be imported in server-side code (API routes, server components).
 */

import { ExecutionContext, IntegrationResult } from '../types';
import { DiscordConfig } from '../definitions/discord';

/**
 * Execute the Discord integration
 */
export async function executeDiscord(
  config: DiscordConfig,
  context: ExecutionContext
): Promise<IntegrationResult> {
  const { logger } = context;
  const endTimer = logger.startTimer('discord_send');

  logger.info('Starting Discord message send', {
    hasWebhookUrl: !!config.webhookUrl,
    hasMessage: !!config.message,
    hasUsername: !!config.username,
  });

  // Substitute variables
  const webhookUrl = context.substituteVariables(config.webhookUrl || '');
  const message = context.substituteVariables(config.message || '');
  const username = context.substituteVariables(config.username || '');

  logger.debug('Variables substituted', {
    webhookUrlLength: webhookUrl.length,
    messageLength: message.length,
  });

  // Validate webhook URL
  if (!webhookUrl) {
    logger.error('No webhook URL specified');
    endTimer();
    return {
      success: false,
      error: 'No webhook URL specified',
      data: { status: 'failed', error: 'Missing webhook URL' },
    };
  }

  // Validate URL format
  try {
    const url = new URL(webhookUrl);
    if (!url.hostname.includes('discord.com') && !url.hostname.includes('discordapp.com')) {
      logger.error('Invalid webhook URL: not a Discord webhook');
      endTimer();
      return {
        success: false,
        error: 'Invalid webhook URL: must be a Discord webhook URL (discord.com or discordapp.com)',
        data: { status: 'failed', error: 'Invalid webhook URL' },
      };
    }
  } catch {
    logger.error('Invalid webhook URL format');
    endTimer();
    return {
      success: false,
      error: 'Invalid webhook URL: not a valid URL',
      data: { status: 'failed', error: 'Invalid URL format' },
    };
  }

  // Validate message
  if (!message) {
    logger.error('No message specified');
    endTimer();
    return {
      success: false,
      error: 'No message specified',
      data: { status: 'failed', error: 'Missing message' },
    };
  }

  try {
    // Build request body
    const body: Record<string, string> = { content: message };
    if (username) {
      body.username = username;
    }

    logger.debug('Sending message to Discord webhook');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      endTimer();
      logger.error('Discord webhook returned error', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return {
        success: false,
        error: `Discord webhook error: ${response.status} ${response.statusText}`,
        data: { status: 'failed', error: errorText },
      };
    }

    endTimer();
    logger.info('Discord message sent successfully');

    return {
      success: true,
      data: { status: 'sent' },
    };
  } catch (error) {
    endTimer();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to send Discord message', { error: errorMessage });

    return {
      success: false,
      error: `Failed to send Discord message: ${errorMessage}`,
      data: { status: 'failed', error: errorMessage },
    };
  }
}
