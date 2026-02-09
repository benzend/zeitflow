/**
 * Integration Definitions
 *
 * This file re-exports all integration definitions.
 * To add a new integration, create a definition file and add it here.
 */

export { emailIntegration, EmailConfigSchema, type EmailConfig } from './email';
export { slackIntegration, SlackConfigSchema, type SlackConfig } from './slack';
export { smsIntegration, SMSConfigSchema, type SMSConfig } from './sms';
export { telegramIntegration, TelegramConfigSchema, type TelegramConfig } from './telegram';
export { youtubeIntegration, YouTubeConfigSchema, type YouTubeConfig } from './youtube';

// Note: Integration definitions use JSX for icons, hence the .tsx extension
