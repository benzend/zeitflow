/**
 * Telegram Integration Executor (Server-Side Only)
 *
 * This file contains the server-side execution logic for the Telegram integration.
 * It should only be imported in server-side code (API routes, server components).
 */

import { ExecutionContext, IntegrationResult } from '../types';
import { TelegramConfig } from '../definitions/telegram';

/**
 * Execute the Telegram integration
 */
export async function executeTelegram(
  config: TelegramConfig,
  context: ExecutionContext
): Promise<IntegrationResult> {
  const { logger } = context;
  const endTimer = logger.startTimer('telegram_send');

  logger.info('Starting Telegram message send', {
    hasChatId: !!config.chatId,
    hasMessage: !!config.message,
    hasCustomBotToken: !!config.botToken,
  });

  // Determine which bot token to use (per-workflow or system)
  const botToken = config.botToken || process.env.TELEGRAM_BOT_TOKEN;

  // Validate bot token
  if (!botToken) {
    logger.error('Telegram bot token not configured');
    endTimer();
    return {
      success: false,
      error: 'Telegram bot token not configured. Set TELEGRAM_BOT_TOKEN or provide a bot token in the node config.',
      data: { status: 'failed', error: 'Missing bot token' },
    };
  }

  // Substitute variables
  const chatId = context.substituteVariables(config.chatId || '');
  const message = context.substituteVariables(config.message || '');

  logger.debug('Variables substituted', {
    chatId: chatId ? chatId.substring(0, 10) + '...' : 'empty',
    messageLength: message.length,
  });

  // Validate chat ID
  if (!chatId) {
    logger.error('No chat ID specified');
    endTimer();
    return {
      success: false,
      error: 'No chat ID specified',
      data: { status: 'failed', error: 'No chat ID' },
    };
  }

  // Validate message
  if (!message) {
    logger.error('No message specified');
    endTimer();
    return {
      success: false,
      error: 'No message specified',
      data: { status: 'failed', error: 'No message' },
    };
  }

  try {
    // Dynamic import to avoid loading heavy dependencies at startup
    const TelegramBot = (await import('node-telegram-bot-api')).default;

    // Create bot instance (polling disabled since we only need to send messages)
    const bot = new TelegramBot(botToken, { polling: false });

    logger.debug('Sending message to Telegram', { chatId: chatId.substring(0, 10) + '...' });

    // Send the message
    const result = await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
    });

    endTimer();

    logger.info('Telegram message sent successfully', {
      messageId: result.message_id,
      chatId: chatId.substring(0, 10) + '...',
    });

    return {
      success: true,
      data: {
        status: 'sent',
        messageId: result.message_id,
      },
    };
  } catch (error) {
    endTimer();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to send Telegram message', {
      error: errorMessage,
    });

    return {
      success: false,
      error: `Failed to send Telegram message: ${errorMessage}`,
      data: {
        status: 'failed',
        error: errorMessage,
      },
    };
  }
}
