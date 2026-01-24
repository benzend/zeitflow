/**
 * Slack Integration Executor (Server-Side Only)
 *
 * This file contains the server-side execution logic for the Slack integration.
 * It should only be imported in server-side code (API routes, server components).
 */

import { ExecutionContext, IntegrationResult } from '../types';
import { SlackConfig } from '../definitions/slack';

/**
 * Execute the Slack integration
 */
export async function executeSlack(
  config: SlackConfig,
  context: ExecutionContext
): Promise<IntegrationResult> {
  const { logger, db, userId } = context;
  const endTimer = logger.startTimer('slack_send');

  logger.info('Starting Slack message send', {
    channel: config.channel,
    hasBotId: !!config.botId,
    hasMessage: !!config.message,
  });

  // Dynamic imports
  const { WebClient } = await import('@slack/web-api');
  const { eq } = await import('drizzle-orm');
  const { slackBotsTable } = await import('../../../schema');

  // Substitute variables
  const channel = context.substituteVariables(config.channel || '#general');
  const message = context.substituteVariables(config.message || 'Workflow update');

  logger.debug('Variables substituted', {
    channel,
    messageLength: message.length,
  });

  // Validate channel format
  if (!channel.match(/^[@#]/)) {
    logger.error('Invalid channel format', { channel });
    endTimer();
    return {
      success: false,
      error: 'Channel must start with # for channels or @ for users',
      data: { status: 'failed', error: 'Invalid channel format' },
    };
  }

  // Get bot token
  let botToken: string | undefined = process.env.SLACK_BOT_TOKEN;

  try {
    if (config.botId && db) {
      logger.debug('Looking up specific bot', { botId: config.botId });
      const [specificBot] = await (db as any)
        .select()
        .from(slackBotsTable)
        .where(eq(slackBotsTable.id, config.botId))
        .limit(1);

      if (!specificBot || specificBot.userId !== userId) {
        logger.error('Bot not found or unauthorized', { botId: config.botId });
        endTimer();
        return {
          success: false,
          error: 'Specified Slack bot not found or unauthorized',
          data: { status: 'failed', error: 'Bot not found' },
        };
      }
      botToken = specificBot.botToken;
      logger.debug('Using specific bot', { botName: specificBot.name });
    } else if (db) {
      logger.debug('Looking up user default bot');
      const [userBot] = await (db as any)
        .select()
        .from(slackBotsTable)
        .where(eq(slackBotsTable.userId, userId))
        .limit(1);

      if (!userBot) {
        logger.error('No Slack bot configured for user');
        endTimer();
        return {
          success: false,
          error: 'No Slack bot configured for this user',
          data: { status: 'failed', error: 'No bot configured' },
        };
      }
      botToken = userBot.botToken;
      logger.debug('Using user default bot', { botName: userBot.name });
    }

    if (!botToken) {
      logger.error('No Slack bot token available');
      endTimer();
      return {
        success: false,
        error: 'No Slack bot token available',
        data: { status: 'failed', error: 'No token' },
      };
    }

    logger.debug('Calling Slack API');
    const client = new WebClient(botToken);
    await client.chat.postMessage({
      channel,
      text: message,
    });

    endTimer();
    logger.info('Slack message sent successfully', { channel });

    return {
      success: true,
      data: { status: 'sent', channel },
    };
  } catch (err) {
    endTimer();
    const errorMessage = err instanceof Error ? err.message : 'Failed to send Slack message';
    logger.error('Slack send failed', { error: errorMessage });
    return {
      success: false,
      error: errorMessage,
      data: { status: 'failed', error: errorMessage, channel },
    };
  }
}
