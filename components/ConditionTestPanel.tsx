/**
 * ConditionTestPanel
 *
 * Allows users to test condition logic with mock data before running the workflow.
 * Provides instant feedback on whether a condition would evaluate to TRUE or FALSE.
 */

import React, { useState } from 'react';
import { ConditionConfig } from '@/lib/integrations/definitions/condition';
import { evaluateConditionClient } from '@/lib/integrations/condition-client';
import { OPERATOR_LABELS } from '@/lib/integrations/condition-helpers';

interface ConditionTestPanelProps {
  config: Partial<ConditionConfig>;
}

export default function ConditionTestPanel({ config }: ConditionTestPanelProps) {
  const [testLeft, setTestLeft] = useState('');
  const [testRight, setTestRight] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const runTest = () => {
    if (!config.operator) {
      return;
    }

    const testResult = evaluateConditionClient(testLeft, config.operator, testRight);
    setResult(testResult);
    setHasRun(true);
  };

  const handleReset = () => {
    setTestLeft('');
    setTestRight('');
    setResult(null);
    setHasRun(false);
  };

  const operatorText = config.operator ? OPERATOR_LABELS[config.operator] : 'operator';
  const showRightValue = config.operator !== 'is_empty' && config.operator !== 'is_not_empty';

  return (
    <details className="border-t border-border pt-4 mt-4">
      <summary className="cursor-pointer font-medium text-foreground hover:text-primary transition-colors">
        Test Condition
      </summary>

      <div className="mt-4 space-y-3">
        <p className="text-xs text-text-muted">
          Test your condition with sample values to see which path would be followed.
        </p>

        {/* Test Left Value */}
        <div>
          <label className="block text-xs font-medium text-foreground-light mb-1">
            Test Left Value
          </label>
          <input
            type="text"
            value={testLeft}
            onChange={e => setTestLeft(e.target.value)}
            placeholder="Enter a test value..."
            className="w-full bg-background-extra-light border-border border-[0.5px] h-[32px] rounded-[8px] px-[12px] text-[12px] text-foreground placeholder-text-placeholder outline-none focus:border-primary"
          />
        </div>

        {/* Test Right Value (only for operators that need it) */}
        {showRightValue && (
          <div>
            <label className="block text-xs font-medium text-foreground-light mb-1">
              Test Right Value
            </label>
            <input
              type="text"
              value={testRight}
              onChange={e => setTestRight(e.target.value)}
              placeholder="Enter a test value..."
              className="w-full bg-background-extra-light border-border border-[0.5px] h-[32px] rounded-[8px] px-[12px] text-[12px] text-foreground placeholder-text-placeholder outline-none focus:border-primary"
            />
          </div>
        )}

        {/* Test Button */}
        <div className="flex gap-2">
          <button
            onClick={runTest}
            disabled={!config.operator || !testLeft}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Run Test
          </button>
          {hasRun && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-background-extra-light text-foreground text-sm font-medium rounded hover:bg-background transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {/* Result Display */}
        {hasRun && result !== null && (
          <div
            className={`p-4 rounded-lg border-2 ${
              result
                ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                : 'bg-red-50 dark:bg-red-900/20 border-red-500'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-2xl font-bold ${
                  result ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {result ? 'TRUE ✓' : 'FALSE ✗'}
              </span>
            </div>

            <div className="text-xs text-text-muted space-y-1">
              <p>
                <span className="font-medium">Comparing:</span>{' '}
                <code className="bg-background px-1 py-0.5 rounded">"{testLeft}"</code>{' '}
                <span className="font-medium">{operatorText}</span>{' '}
                {showRightValue && (
                  <code className="bg-background px-1 py-0.5 rounded">"{testRight}"</code>
                )}
              </p>
              <p className="mt-2">
                {result ? (
                  <>
                    <span style={{ color: '#4CAF50' }} className="font-semibold">✓</span> Workflow would follow the{' '}
                    <span style={{ color: '#4CAF50' }} className="font-semibold">green (true)</span> path
                  </>
                ) : (
                  <>
                    <span style={{ color: '#F44336' }} className="font-semibold">✗</span> Workflow would follow the{' '}
                    <span style={{ color: '#F44336' }} className="font-semibold">red (false)</span> path
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
