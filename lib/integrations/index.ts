/**
 * Integrations Module
 *
 * Scalable plugin-based integration system for workflow nodes.
 *
 * ## Adding a New Integration
 *
 * 1. Create a definition file in `./definitions/`:
 *    ```typescript
 *    // lib/integrations/definitions/discord.ts
 *    import { z } from 'zod';
 *    import { IntegrationDefinition } from '../types';
 *
 *    export const DiscordConfigSchema = z.object({
 *      webhookUrl: z.string().url(),
 *      message: z.string(),
 *    });
 *
 *    export const discordIntegration: IntegrationDefinition<typeof DiscordConfigSchema> = {
 *      id: 'discord',
 *      name: 'Discord',
 *      description: 'Send messages to Discord via webhook',
 *      category: 'communication',
 *      icon: DiscordIcon,
 *      color: '#5865F2',
 *      configSchema: DiscordConfigSchema,
 *      defaultConfig: { webhookUrl: '', message: '' },
 *      uiConfig: {
 *        webhookUrl: { hint: 'text', label: 'Webhook URL', placeholder: 'https://discord.com/api/webhooks/...' },
 *        message: { hint: 'textarea', label: 'Message', supportsVariables: true },
 *      },
 *      auth: { type: 'none' },
 *      outputVariables: [{ name: 'status', type: 'string' }],
 *      async execute(config, context) {
 *        // Implementation
 *      },
 *    };
 *    ```
 *
 * 2. Add to `./definitions/index.ts`:
 *    ```typescript
 *    export { discordIntegration } from './discord';
 *    ```
 *
 * 3. Add to `./registry.ts`:
 *    ```typescript
 *    import { discordIntegration } from './definitions';
 *
 *    const integrations = {
 *      // ...existing
 *      discord: discordIntegration,
 *    };
 *    ```
 *
 * That's it! The integration automatically:
 * - Appears in the node palette
 * - Has config UI generated from its schema
 * - Validates with Zod
 * - Executes with variable substitution
 * - Returns consistent output format
 * - Has full structured logging
 */

// Types
export * from './types';

// Logger
export * from './logger';

// Registry (client-safe)
export * from './registry';

// Individual integration definitions (client-safe metadata)
export * from './definitions';

// NOTE: Executors are NOT exported from this index file because they
// contain server-side code (Twilio, Resend, Slack API).
// Import executors directly in server-side code:
//   import { executeIntegration } from '@/lib/integrations/executor';
// or
//   import { executeEmail } from '@/lib/integrations/executors/email';
