/**
 * Tests for integration registry deep cloning
 */

import { getIntegrationDefaultConfig } from '@/lib/integrations/registry';

describe('Integration Registry - Deep Cloning', () => {
  test('getIntegrationDefaultConfig returns independent copies for email', () => {
    const config1 = getIntegrationDefaultConfig('email') as any;
    const config2 = getIntegrationDefaultConfig('email') as any;

    // Verify both configs exist
    expect(config1).toBeDefined();
    expect(config2).toBeDefined();

    // Modify config1
    config1.to = ['test@example.com'];
    config1.subject = 'Modified Subject';

    // Verify config2 is not affected
    expect(config2.to).not.toEqual(['test@example.com']);
    expect(config2.subject).not.toEqual('Modified Subject');
  });

  test('getIntegrationDefaultConfig returns independent copies for SMS', () => {
    const config1 = getIntegrationDefaultConfig('sms') as any;
    const config2 = getIntegrationDefaultConfig('sms') as any;

    // Verify both configs exist
    expect(config1).toBeDefined();
    expect(config2).toBeDefined();

    // Modify config1
    config1.to = ['+14155552671'];
    config1.message = 'Modified Message';

    // Verify config2 is not affected
    expect(config2.to).not.toEqual(['+14155552671']);
    expect(config2.message).not.toEqual('Modified Message');
  });

  test('getIntegrationDefaultConfig returns independent copies for Slack', () => {
    const config1 = getIntegrationDefaultConfig('slack') as any;
    const config2 = getIntegrationDefaultConfig('slack') as any;

    // Verify both configs exist
    expect(config1).toBeDefined();
    expect(config2).toBeDefined();

    // Modify config1
    config1.channel = '#modified-channel';
    config1.message = 'Modified Message';

    // Verify config2 is not affected
    expect(config2.channel).not.toEqual('#modified-channel');
    expect(config2.message).not.toEqual('Modified Message');
  });

  test('getIntegrationDefaultConfig returns independent copies for condition', () => {
    const config1 = getIntegrationDefaultConfig('condition') as any;
    const config2 = getIntegrationDefaultConfig('condition') as any;

    // Verify both configs exist
    expect(config1).toBeDefined();
    expect(config2).toBeDefined();

    // Modify config1
    config1.operator = 'modified-operator';
    config1.leftValue = 'modified-value';

    // Verify config2 is not affected
    expect(config2.operator).not.toEqual('modified-operator');
    expect(config2.leftValue).not.toEqual('modified-value');
  });

  test('getIntegrationDefaultConfig returns undefined for unknown integration', () => {
    const config = getIntegrationDefaultConfig('unknown-integration');
    expect(config).toBeUndefined();
  });

  test('getIntegrationDefaultConfig deep clones nested arrays', () => {
    const config1 = getIntegrationDefaultConfig('email') as any;
    const config2 = getIntegrationDefaultConfig('email') as any;

    // Verify both configs exist
    expect(config1).toBeDefined();
    expect(config2).toBeDefined();

    // Modify nested array in config1
    if (Array.isArray(config1.to)) {
      config1.to.push('new@example.com');
    }

    // Verify config2's array is not affected
    if (Array.isArray(config2.to) && Array.isArray(config1.to)) {
      expect(config2.to.length).toBeLessThan(config1.to.length);
    }
  });
});
