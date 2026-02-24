/**
 * Integration Executors (Server-Side Only)
 *
 * This file exports all integration executor functions.
 * These should only be imported in server-side code.
 */

export { executeEmail } from './email';
export { executeSlack } from './slack';
export { executeSMS } from './sms';
export { executeTelegram } from './telegram';
export { executeCondition } from './condition';
export { executeYouTube } from './youtube';
export { executeDiscord } from './discord';
export { executeHttpRequest } from './http-request';
export { executeGoogleSheets } from './google-sheets';
export { executeGitHub } from './github';
export { executeNotion } from './notion';
export { executeAirtable } from './airtable';
export { executeWhatsApp } from './whatsapp';
export { executeJira } from './jira';
export { executeHubSpot } from './hubspot';
export { executeWebhook } from './webhook';

import { ExecutionContext, IntegrationResult } from '../types';
import { executeEmail } from './email';
import { executeSlack } from './slack';
import { executeSMS } from './sms';
import { executeTelegram } from './telegram';
import { executeCondition } from './condition';
import { executeYouTube } from './youtube';
import { executeDiscord } from './discord';
import { executeHttpRequest } from './http-request';
import { executeGoogleSheets } from './google-sheets';
import { executeGitHub } from './github';
import { executeNotion } from './notion';
import { executeAirtable } from './airtable';
import { executeWhatsApp } from './whatsapp';
import { executeJira } from './jira';
import { executeHubSpot } from './hubspot';
import { executeWebhook } from './webhook';

/**
 * Map of integration IDs to their executor functions
 */
export const integrationExecutors: Record<
  string,
  (config: any, context: ExecutionContext) => Promise<IntegrationResult>
> = {
  email: executeEmail,
  slack: executeSlack,
  sms: executeSMS,
  telegram: executeTelegram,
  condition: executeCondition,
  youtube: executeYouTube,
  discord: executeDiscord,
  http_request: executeHttpRequest,
  google_sheets: executeGoogleSheets,
  github: executeGitHub,
  notion: executeNotion,
  airtable: executeAirtable,
  whatsapp: executeWhatsApp,
  jira: executeJira,
  hubspot: executeHubSpot,
  webhook: executeWebhook,
};

/**
 * Get executor for an integration by ID
 */
export function getIntegrationExecutor(
  integrationId: string
): ((config: any, context: ExecutionContext) => Promise<IntegrationResult>) | undefined {
  return integrationExecutors[integrationId];
}
