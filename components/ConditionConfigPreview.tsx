/**
 * ConditionConfigPreview
 *
 * Displays a live preview of the condition expression as user configures it.
 * Shows the condition in a readable format with color-coded path indicators.
 */

import React from 'react';
import { ConditionConfig } from '@/lib/integrations/definitions/condition';
import { OPERATOR_LABELS } from '@/lib/integrations/condition-helpers';

interface ConditionConfigPreviewProps {
  config: Partial<ConditionConfig>;
}

export default function ConditionConfigPreview({ config }: ConditionConfigPreviewProps) {
  const operatorText = config.operator ? OPERATOR_LABELS[config.operator] : 'operator';
  const leftValue = config.leftValue || '___';
  const rightValue = config.rightValue || '___';

  // For is_empty/is_not_empty operators, we don't need the right value
  const showRightValue = config.operator !== 'is_empty' && config.operator !== 'is_not_empty';

  return (
    <div className="bg-background-extra-light border border-border rounded-lg p-4 mb-4">
      {/* Main condition expression */}
      <div className="text-sm mb-3">
        <span className="font-semibold text-foreground">IF</span>{' '}
        <code className="bg-background px-2 py-1 rounded text-xs font-mono text-foreground">
          {leftValue}
        </code>{' '}
        <span className="text-primary font-medium">{operatorText}</span>
        {showRightValue && (
          <>
            {' '}
            <code className="bg-background px-2 py-1 rounded text-xs font-mono text-foreground">
              {rightValue}
            </code>
          </>
        )}
      </div>

      {/* Path indicators */}
      <div className="text-xs text-text-muted space-y-1">
        <div>
          <span className="font-semibold" style={{ color: '#4CAF50' }}>✓ THEN</span>{' '}
          follow green path (true)
        </div>
        <div>
          <span className="font-semibold" style={{ color: '#F44336' }}>✗ ELSE</span>{' '}
          follow red path (false)
        </div>
      </div>
    </div>
  );
}
