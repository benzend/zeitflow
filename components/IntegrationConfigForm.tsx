/**
 * IntegrationConfigForm
 *
 * Auto-generates configuration UI from integration uiConfig schema.
 * Supports variable substitution, validation, and custom field types.
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import TypeaheadTextarea from './TypeaheadTextarea';
import TypeaheadInput from './TypeaheadInput';
import RecipientsInput from './RecipientsInput';
import { getIntegrationUIMetadata, IntegrationUIMetadata } from '@/lib/integrations/registry';
import { FieldUIConfig } from '@/lib/integrations/types';
import ConditionConfigPreview from './ConditionConfigPreview';
import ConditionTestPanel from './ConditionTestPanel';
import { ConditionConfig } from '@/lib/integrations/definitions/condition';
import { processPhoneRecipients, processEmailRecipients, containsVariableSyntax } from '@/lib/phone-utils';
import { Button } from './Button';

interface IntegrationConfigFormProps {
  /** Integration ID (e.g., 'email', 'slack', 'sms') */
  integrationId: string;
  /** Current config values */
  config: Record<string, unknown>;
  /** Called when config changes */
  onChange: (config: Record<string, unknown>) => void;
  /** Variable suggestions for typeahead */
  variableSuggestions?: (string | { name: string; description: string })[];
  /** Server data for dynamic fields (e.g., slack bots) */
  serverData?: Record<string, unknown[]>;
  /** Custom class name for the container */
  className?: string;
}

/**
 * Single field renderer based on hint type
 */
interface FieldRendererProps {
  fieldKey: string;
  fieldConfig: FieldUIConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  variableSuggestions: (string | { name: string; description: string })[];
  serverData?: unknown[];
}

function FieldRenderer({
  fieldKey,
  fieldConfig,
  value,
  onChange,
  variableSuggestions,
  serverData,
}: FieldRendererProps) {
  const inputClassName =
    'w-full bg-background-extra-light border-border border-[0.5px] h-[32px] rounded-[8px] overflow-hidden px-[12px] text-[12px] text-foreground placeholder-text-placeholder outline-none';

  const textareaClassName =
    'bg-transparent font-["Inter:Regular",_sans-serif] font-normal h-[119px] leading-[normal] not-italic outline-none p-4 resize-none text-sm text-foreground w-full';

  switch (fieldConfig.hint) {
    case 'recipients': {
      // Email or phone recipients (chip-based input)
      const isPhone = fieldConfig.validationHint?.toLowerCase().includes('phone') ||
                      fieldConfig.validationHint?.includes('E.164');

      return (
        <div className="mb-[16px]">
          <label className="block text-foreground-light font-medium mb-[8px]">
            {fieldConfig.label}
          </label>
          <RecipientsInput
            value={Array.isArray(value) ? value : []}
            onChange={(newValue) => onChange(newValue)}
            validationType={isPhone ? 'phone' : 'email'}
            placeholder={fieldConfig.placeholder}
            variableSuggestions={variableSuggestions}
          />
          {fieldConfig.validationHint && (
            <p className="text-text-muted text-[10px] mt-[4px] px-[2px]">
              {fieldConfig.validationHint}
            </p>
          )}
        </div>
      );
    }

    case 'text':
    case 'email': {
      if (fieldConfig.supportsVariables) {
        return (
          <div className="mb-[16px]">
            <label className="block text-foreground-light font-medium mb-[8px]">
              {fieldConfig.label}
            </label>
            <div className="bg-background-extra-light mt-[4px] rounded">
              <TypeaheadInput
                value={(value as string) || ''}
                onChange={v => onChange(v)}
                suggestions={variableSuggestions}
                className={inputClassName}
                placeholder={fieldConfig.placeholder}
                hintNoSuggestionsMessage="No variables found"
              />
            </div>
            {fieldConfig.validationHint && (
              <p className="text-text-muted text-[10px] mt-[4px] px-[2px]">
                {fieldConfig.validationHint}
              </p>
            )}
          </div>
        );
      }

      return (
        <div className="mb-[16px]">
          <label className="block text-foreground-light font-medium mb-[8px]">
            {fieldConfig.label}
          </label>
          <input
            type={fieldConfig.hint === 'email' ? 'email' : 'text'}
            value={(value as string) || ''}
            onChange={e => onChange(e.target.value)}
            className={inputClassName}
            placeholder={fieldConfig.placeholder}
          />
          {fieldConfig.validationHint && (
            <p className="text-text-muted text-[10px] mt-[4px] px-[2px]">
              {fieldConfig.validationHint}
            </p>
          )}
        </div>
      );
    }

    case 'channel': {
      return (
        <div className="mb-[16px]">
          <label className="block text-foreground-light font-medium mb-[8px]">
            {fieldConfig.label}
          </label>
          <input
            type="text"
            value={(value as string) || ''}
            onChange={e => onChange(e.target.value)}
            className={inputClassName}
            placeholder={fieldConfig.placeholder}
          />
          {fieldConfig.validationHint && (
            <p className="text-text-muted text-[10px] mt-[4px] px-[2px]">
              {fieldConfig.validationHint}
            </p>
          )}
        </div>
      );
    }

    case 'textarea': {
      if (fieldConfig.supportsVariables) {
        return (
          <div className="mb-[16px]">
            <label className="block text-foreground-light font-medium mb-[8px]">
              {fieldConfig.label}
            </label>
            <div className="bg-background-extra-light mt-[4px] rounded">
              <TypeaheadTextarea
                value={(value as string) || ''}
                onChange={v => onChange(v)}
                suggestions={variableSuggestions}
                className={textareaClassName}
                placeholder={fieldConfig.placeholder}
                hintNoSuggestionsMessage="No variables found"
              />
            </div>
            {fieldConfig.validationHint && (
              <p className="text-text-muted text-[10px] mt-[4px] px-[2px]">
                {fieldConfig.validationHint}
              </p>
            )}
          </div>
        );
      }

      return (
        <div className="mb-[16px]">
          <label className="block text-foreground-light font-medium mb-[8px]">
            {fieldConfig.label}
          </label>
          <textarea
            value={(value as string) || ''}
            onChange={e => onChange(e.target.value)}
            className={`${inputClassName} h-[119px] py-3`}
            placeholder={fieldConfig.placeholder}
          />
        </div>
      );
    }

    case 'select': {
      // Use serverData if requiresServerData is set, otherwise use static options
      const options = fieldConfig.requiresServerData
        ? (serverData || []).map((item: any) => ({
            value: String(item.id),
            label: item.name
              ? `${item.name}${item.teamName ? ` (${item.teamName})` : ''}`
              : String(item.id),
          }))
        : fieldConfig.options || [];

      return (
        <div className="mb-[16px]">
          <label className="block text-foreground-light font-medium mb-[8px]">
            {fieldConfig.label}
          </label>
          <select
            value={value !== undefined ? String(value) : ''}
            onChange={e => {
              const newValue = e.target.value;
              // Convert to number for IDs, keep as string otherwise
              onChange(newValue ? (isNaN(Number(newValue)) ? newValue : Number(newValue)) : undefined);
            }}
            className={inputClassName}
          >
            <option value="">{fieldConfig.placeholder || 'Select...'}</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    case 'multiselect': {
      // Basic multi-select as comma-separated values for now
      // Could be enhanced with a proper multi-select component
      const selectedValues = Array.isArray(value) ? value : [];
      const options = fieldConfig.options || [];

      return (
        <div className="mb-[16px]">
          <label className="block text-foreground-light font-medium mb-[8px]">
            {fieldConfig.label}
          </label>
          <div className="space-y-1">
            {options.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(opt.value)}
                  onChange={e => {
                    if (e.target.checked) {
                      onChange([...selectedValues, opt.value]);
                    } else {
                      onChange(selectedValues.filter((v: string) => v !== opt.value));
                    }
                  }}
                  className="rounded border-border"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      );
    }

    case 'phone': {
      return (
        <div className="mb-[16px]">
          <label className="block text-foreground-light font-medium mb-[8px]">
            {fieldConfig.label}
          </label>
          <input
            type="tel"
            value={(value as string) || ''}
            onChange={e => onChange(e.target.value)}
            className={inputClassName}
            placeholder={fieldConfig.placeholder}
          />
          {fieldConfig.validationHint && (
            <p className="text-text-muted text-[10px] mt-[4px] px-[2px]">
              {fieldConfig.validationHint}
            </p>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

/**
 * IntegrationConfigForm component
 */
export default function IntegrationConfigForm({
  integrationId,
  config,
  onChange,
  variableSuggestions = [],
  serverData = {},
  className = '',
}: IntegrationConfigFormProps) {
  const metadata = useMemo(() => getIntegrationUIMetadata(integrationId), [integrationId]);
  const [isConnecting, setIsConnecting] = useState(false);

  const needsOAuth = metadata?.auth?.type === 'oauth';
  const connectUrl = needsOAuth ? `/api/auth/connect/${integrationId}` : null;

  const handleConnect = () => {
    if (connectUrl) {
      setIsConnecting(true);
      window.location.href = connectUrl;
    }
  };

  const handleFieldChange = useCallback(
    (fieldKey: string, value: unknown) => {
      // Deep clone to ensure complete isolation
      const clonedConfig = JSON.parse(JSON.stringify(config));
      onChange({
        ...clonedConfig,
        [fieldKey]: value,
      });
    },
    [config, onChange]
  );

  if (!metadata) {
    return (
      <div className={className}>
        <p className="text-text-muted text-sm">Unknown integration: {integrationId}</p>
      </div>
    );
  }

  const { uiConfig, name, description } = metadata;
  const fields = Object.entries(uiConfig) as [string, FieldUIConfig][];

  return (
    <div className={`mt-[20px] px-[20px] pb-[20px] ${className}`}>
      <div className="mb-[12px]">
        <h3 className="text-foreground text-lg font-bold mb-[4px]">{name} Configuration</h3>
        <p className="text-text-muted text-sm leading-relaxed">{description}</p>
      </div>

      {/* OAuth connection prompt */}
      {needsOAuth && connectUrl && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-foreground mb-2">
            This integration requires access to your {name} account.
          </p>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            variant="secondary"
            className="w-full"
          >
            {isConnecting ? 'Connecting...' : `Connect ${name} Account`}
          </Button>
        </div>
      )}

      {/* Special preview for condition nodes */}
      {integrationId === 'condition' && (
        <ConditionConfigPreview config={config as Partial<ConditionConfig>} />
      )}

      {fields.map(([fieldKey, fieldConfig]) => (
        <FieldRenderer
          key={fieldKey}
          fieldKey={fieldKey}
          fieldConfig={fieldConfig}
          value={config[fieldKey]}
          onChange={value => handleFieldChange(fieldKey, value)}
          variableSuggestions={variableSuggestions}
          serverData={
            fieldConfig.requiresServerData
              ? (serverData[fieldConfig.requiresServerData] as unknown[])
              : undefined
          }
        />
      ))}

      {/* Special test panel for condition nodes */}
      {integrationId === 'condition' && (
        <ConditionTestPanel config={config as Partial<ConditionConfig>} />
      )}
    </div>
  );
}
