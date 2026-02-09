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

import { ExecutionContext, IntegrationResult } from '../types';
import { executeEmail } from './email';
import { executeSlack } from './slack';
import { executeSMS } from './sms';
import { executeTelegram } from './telegram';
import { executeCondition } from './condition';
import { executeYouTube } from './youtube';

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
};

/**
 * Get executor for an integration by ID
 */
export function getIntegrationExecutor(
  integrationId: string
): ((config: any, context: ExecutionContext) => Promise<IntegrationResult>) | undefined {
  return integrationExecutors[integrationId];
}
