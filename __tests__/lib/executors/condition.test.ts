/**
 * Condition Integration Executor Tests
 */

import { executeCondition } from '@/lib/integrations/executors/condition';
import { ExecutionContext, IntegrationLogger } from '@/lib/integrations/types';
import { ConditionConfig } from '@/lib/integrations/definitions/condition';

function createMockLogger(): IntegrationLogger {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    startTimer: jest.fn(() => jest.fn()),
    getEntries: jest.fn(() => []),
  };
}

function createMockContext(overrides?: Partial<ExecutionContext>): ExecutionContext {
  return {
    userId: 'user-1',
    executionId: 'exec-1',
    nodeId: 'node-1',
    variables: {},
    substituteVariables: (template: string) => template,
    logger: createMockLogger(),
    ...overrides,
  };
}

describe('executeCondition', () => {
  describe('equals operator', () => {
    it('returns true for matching values (case insensitive)', async () => {
      const config: ConditionConfig = {
        leftValue: 'Hello',
        operator: 'equals',
        rightValue: 'hello',
      };
      const result = await executeCondition(config, createMockContext());

      expect(result.success).toBe(true);
      expect(result.data?.result).toBe(true);
      expect(result.data?.path).toBe('true');
    });

    it('returns false for non-matching values', async () => {
      const config: ConditionConfig = {
        leftValue: 'foo',
        operator: 'equals',
        rightValue: 'bar',
      };
      const result = await executeCondition(config, createMockContext());

      expect(result.data?.result).toBe(false);
      expect(result.data?.path).toBe('false');
    });
  });

  describe('not_equals operator', () => {
    it('returns true for different values', async () => {
      const config: ConditionConfig = {
        leftValue: 'A',
        operator: 'not_equals',
        rightValue: 'B',
      };
      const result = await executeCondition(config, createMockContext());
      expect(result.data?.result).toBe(true);
    });
  });

  describe('contains operator', () => {
    it('returns true when left contains right', async () => {
      const config: ConditionConfig = {
        leftValue: 'Hello World',
        operator: 'contains',
        rightValue: 'world',
      };
      const result = await executeCondition(config, createMockContext());
      expect(result.data?.result).toBe(true);
    });

    it('returns false when left does not contain right', async () => {
      const config: ConditionConfig = {
        leftValue: 'Hello World',
        operator: 'contains',
        rightValue: 'xyz',
      };
      const result = await executeCondition(config, createMockContext());
      expect(result.data?.result).toBe(false);
    });
  });

  describe('not_contains operator', () => {
    it('returns true when left does not contain right', async () => {
      const config: ConditionConfig = {
        leftValue: 'Hello',
        operator: 'not_contains',
        rightValue: 'xyz',
      };
      const result = await executeCondition(config, createMockContext());
      expect(result.data?.result).toBe(true);
    });
  });

  describe('greater_than operator', () => {
    it('compares numbers correctly', async () => {
      const config: ConditionConfig = {
        leftValue: '10',
        operator: 'greater_than',
        rightValue: '5',
      };
      const result = await executeCondition(config, createMockContext());
      expect(result.data?.result).toBe(true);
    });

    it('returns false for non-numeric values', async () => {
      const context = createMockContext();
      const config: ConditionConfig = {
        leftValue: 'abc',
        operator: 'greater_than',
        rightValue: '5',
      };
      const result = await executeCondition(config, context);
      expect(result.data?.result).toBe(false);
      expect(context.logger.warn).toHaveBeenCalled();
    });
  });

  describe('less_than operator', () => {
    it('compares numbers correctly', async () => {
      const config: ConditionConfig = {
        leftValue: '3',
        operator: 'less_than',
        rightValue: '10',
      };
      const result = await executeCondition(config, createMockContext());
      expect(result.data?.result).toBe(true);
    });
  });

  describe('is_empty operator', () => {
    it('returns true for empty string', async () => {
      const config: ConditionConfig = {
        leftValue: '',
        operator: 'is_empty',
        rightValue: '',
      };
      const result = await executeCondition(config, createMockContext());
      expect(result.data?.result).toBe(true);
    });

    it('returns false for non-empty string', async () => {
      const config: ConditionConfig = {
        leftValue: 'something',
        operator: 'is_empty',
        rightValue: '',
      };
      const result = await executeCondition(config, createMockContext());
      expect(result.data?.result).toBe(false);
    });
  });

  describe('is_not_empty operator', () => {
    it('returns true for non-empty string', async () => {
      const config: ConditionConfig = {
        leftValue: 'value',
        operator: 'is_not_empty',
        rightValue: '',
      };
      const result = await executeCondition(config, createMockContext());
      expect(result.data?.result).toBe(true);
    });
  });

  describe('variable substitution', () => {
    it('substitutes variables before evaluation', async () => {
      const substituteVariables = jest.fn((template: string) => {
        if (template === '{{count}}') return '42';
        if (template === '{{threshold}}') return '10';
        return template;
      });

      const config: ConditionConfig = {
        leftValue: '{{count}}',
        operator: 'greater_than',
        rightValue: '{{threshold}}',
      };
      const context = createMockContext({ substituteVariables });

      const result = await executeCondition(config, context);

      expect(result.data?.result).toBe(true);
      expect(substituteVariables).toHaveBeenCalledWith('{{count}}');
      expect(substituteVariables).toHaveBeenCalledWith('{{threshold}}');
    });
  });

  it('always returns success (conditions evaluate, not fail)', async () => {
    const config: ConditionConfig = {
      leftValue: 'any',
      operator: 'equals',
      rightValue: 'other',
    };
    const result = await executeCondition(config, createMockContext());
    expect(result.success).toBe(true);
  });
});
