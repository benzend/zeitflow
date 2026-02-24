import React from 'react';
import { z } from 'zod';
import { IntegrationDefinition } from '../types';

/**
 * HubSpot icon component
 */
const HubSpotIcon = ({ className, color }: { className?: string; color?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.984v-.066A2.198 2.198 0 0017.236.84h-.065a2.198 2.198 0 00-2.196 2.195v.066c0 .87.51 1.62 1.247 1.974v2.856a5.444 5.444 0 00-2.635 1.348l-6.97-5.427a2.502 2.502 0 00.075-.593 2.527 2.527 0 10-2.527 2.527c.395 0 .768-.095 1.103-.258l6.849 5.333a5.472 5.472 0 00-.648 2.59c0 .96.25 1.862.686 2.647l-2.166 2.166a1.89 1.89 0 00-.556-.09 1.92 1.92 0 101.92 1.92c0-.196-.037-.383-.09-.557l2.13-2.13a5.488 5.488 0 003.267 1.073 5.502 5.502 0 005.496-5.497 5.502 5.502 0 00-4.437-5.395zm-1.01 8.506a3.098 3.098 0 01-3.109-3.087 3.098 3.098 0 013.11-3.087 3.098 3.098 0 013.108 3.087 3.098 3.098 0 01-3.109 3.087z"
      fill={color || 'currentColor'}
    />
  </svg>
);

/**
 * Zod schema for HubSpot configuration
 */
export const HubSpotConfigSchema = z.object({
  action: z.enum(['create_contact', 'update_contact', 'search_contacts', 'create_deal', 'update_deal', 'search_deals']).default('create_contact'),
  accessToken: z.string().optional().default(''),
  email: z.string().optional().default(''),
  firstName: z.string().optional().default(''),
  lastName: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  company: z.string().optional().default(''),
  contactId: z.string().optional().default(''),
  dealName: z.string().optional().default(''),
  dealStage: z.string().optional().default('appointmentscheduled'),
  amount: z.string().optional().default(''),
  pipeline: z.string().optional().default('default'),
  dealId: z.string().optional().default(''),
  searchQuery: z.string().optional().default(''),
});

export type HubSpotConfig = z.infer<typeof HubSpotConfigSchema>;

/**
 * HubSpot integration definition (client-safe metadata only)
 * Execute function is defined in executors/hubspot.ts
 */
export const hubspotIntegration: Omit<IntegrationDefinition<typeof HubSpotConfigSchema>, 'execute'> = {
  id: 'hubspot',
  name: 'HubSpot',
  description: 'Manage contacts and deals in HubSpot CRM',
  category: 'data',

  icon: HubSpotIcon,
  color: '#FF7A59',

  configSchema: HubSpotConfigSchema,
  defaultConfig: {
    action: 'create_contact',
    accessToken: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    contactId: '',
    dealName: '',
    dealStage: 'appointmentscheduled',
    amount: '',
    pipeline: 'default',
    dealId: '',
    searchQuery: '',
  },

  uiConfig: {
    action: {
      hint: 'select',
      label: 'Action',
      options: [
        { value: 'create_contact', label: 'Create Contact' },
        { value: 'update_contact', label: 'Update Contact' },
        { value: 'search_contacts', label: 'Search Contacts' },
        { value: 'create_deal', label: 'Create Deal' },
        { value: 'update_deal', label: 'Update Deal' },
        { value: 'search_deals', label: 'Search Deals' },
      ],
    },
    accessToken: {
      hint: 'text',
      label: 'Access Token (optional)',
      placeholder: 'Leave empty to use HUBSPOT_ACCESS_TOKEN env var',
      supportsVariables: false,
      validationHint: 'A HubSpot private app access token. Create one at app.hubspot.com > Settings > Integrations > Private Apps.',
    },
    email: {
      hint: 'email',
      label: 'Email',
      placeholder: '{{entry.email}}',
      supportsVariables: true,
      validationHint: 'Contact email address. Required for create, used as identifier for update.',
    },
    firstName: {
      hint: 'text',
      label: 'First Name',
      placeholder: '{{entry.first_name}}',
      supportsVariables: true,
    },
    lastName: {
      hint: 'text',
      label: 'Last Name',
      placeholder: '{{entry.last_name}}',
      supportsVariables: true,
    },
    phone: {
      hint: 'text',
      label: 'Phone',
      placeholder: '{{entry.phone}}',
      supportsVariables: true,
    },
    company: {
      hint: 'text',
      label: 'Company',
      placeholder: '{{entry.company}}',
      supportsVariables: true,
    },
    contactId: {
      hint: 'text',
      label: 'Contact ID',
      placeholder: '12345',
      supportsVariables: true,
      validationHint: 'HubSpot contact ID. Required for update_contact.',
    },
    dealName: {
      hint: 'text',
      label: 'Deal Name',
      placeholder: 'New deal from {{entry.company}}',
      supportsVariables: true,
      validationHint: 'Required for create_deal.',
    },
    dealStage: {
      hint: 'select',
      label: 'Deal Stage',
      options: [
        { value: 'appointmentscheduled', label: 'Appointment Scheduled' },
        { value: 'qualifiedtobuy', label: 'Qualified to Buy' },
        { value: 'presentationscheduled', label: 'Presentation Scheduled' },
        { value: 'decisionmakerboughtin', label: 'Decision Maker Bought-In' },
        { value: 'contractsent', label: 'Contract Sent' },
        { value: 'closedwon', label: 'Closed Won' },
        { value: 'closedlost', label: 'Closed Lost' },
      ],
      validationHint: 'Default pipeline stages. Custom pipelines may have different stage IDs.',
    },
    amount: {
      hint: 'text',
      label: 'Amount',
      placeholder: '10000',
      supportsVariables: true,
      validationHint: 'Deal amount in your default currency.',
    },
    pipeline: {
      hint: 'text',
      label: 'Pipeline',
      placeholder: 'default',
      supportsVariables: true,
      validationHint: 'Pipeline ID. Use "default" for the default sales pipeline.',
    },
    dealId: {
      hint: 'text',
      label: 'Deal ID',
      placeholder: '12345',
      supportsVariables: true,
      validationHint: 'HubSpot deal ID. Required for update_deal.',
    },
    searchQuery: {
      hint: 'text',
      label: 'Search Query',
      placeholder: 'john@example.com',
      supportsVariables: true,
      validationHint: 'Search query string. Searches across default searchable properties.',
    },
  },

  auth: {
    type: 'api_key',
    envVar: 'HUBSPOT_ACCESS_TOKEN',
  },

  outputVariables: [
    { name: 'status', type: 'string', description: 'Operation status (created/updated/found/failed)' },
    { name: 'contactId', type: 'string', description: 'Contact ID' },
    { name: 'dealId', type: 'string', description: 'Deal ID' },
    { name: 'results', type: 'object', description: 'Array of results (for search actions)' },
    { name: 'resultCount', type: 'number', description: 'Number of results found' },
    { name: 'error', type: 'string', description: 'Error message if failed' },
  ],
};
