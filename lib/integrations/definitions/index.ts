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
export { discordIntegration, DiscordConfigSchema, type DiscordConfig } from './discord';
export { httpRequestIntegration, HttpRequestConfigSchema, type HttpRequestConfig } from './http-request';
export { googleSheetsIntegration, GoogleSheetsConfigSchema, type GoogleSheetsConfig } from './google-sheets';
export { githubIntegration, GitHubConfigSchema, type GitHubConfig } from './github';
export { notionIntegration, NotionConfigSchema, type NotionConfig } from './notion';
export { airtableIntegration, AirtableConfigSchema, type AirtableConfig } from './airtable';

// Note: Integration definitions use JSX for icons, hence the .tsx extension
