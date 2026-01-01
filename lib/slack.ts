import { WebClient } from '@slack/web-api';
import { db } from './db';
import { slackBotsTable } from '../schema';
import { eq } from 'drizzle-orm';

export async function sendSlackMessage(
  config: { botId?: number; channel: string; message?: string },
  variables?: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get bot from database if botId provided
    let botToken = process.env.SLACK_BOT_TOKEN; // Fallback to global token
    
    if (config.botId) {
      const bot = await db
        .select()
        .from(slackBotsTable)
        .where(eq(slackBotsTable.id, config.botId))
        .limit(1);
      
      if (bot.length > 0 && bot[0].isActive) {
        botToken = bot[0].botToken;
      } else {
        return { success: false, error: 'Bot not found or inactive' };
      }
    }

    if (!botToken) {
      return { success: false, error: 'No Slack bot token available' };
    }

    const client = new WebClient(botToken);
    
    let message = config.message || 'Workflow update';
    
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
    }

    // Validate channel format (basic validation)
    if (!config.channel.match(/^[@#]/)) {
      return { success: false, error: 'Channel must start with # for channels or @ for users' };
    }

    await client.chat.postMessage({
      channel: config.channel,
      text: message,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending Slack message:', error);
    return { success: false, error: 'Failed to send Slack message' };
  }
}