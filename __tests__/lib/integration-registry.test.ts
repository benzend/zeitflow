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

  test('getIntegrationDefaultConfig returns independent copies for discord', () => {
    const config1 = getIntegrationDefaultConfig('discord') as any;
    const config2 = getIntegrationDefaultConfig('discord') as any;

    expect(config1).toBeDefined();
    expect(config2).toBeDefined();

    config1.webhookUrl = 'https://discord.com/modified';
    config1.message = 'Modified Message';

    expect(config2.webhookUrl).not.toEqual('https://discord.com/modified');
    expect(config2.message).not.toEqual('Modified Message');
  });

  test('getIntegrationDefaultConfig returns independent copies for http_request', () => {
    const config1 = getIntegrationDefaultConfig('http_request') as any;
    const config2 = getIntegrationDefaultConfig('http_request') as any;

    expect(config1).toBeDefined();
    expect(config2).toBeDefined();

    config1.url = 'https://modified.com';
    config1.method = 'PUT';

    expect(config2.url).not.toEqual('https://modified.com');
    expect(config2.method).not.toEqual('PUT');
  });

  test('getIntegrationDefaultConfig returns independent copies for google_sheets', () => {
    const config1 = getIntegrationDefaultConfig('google_sheets') as any;
    const config2 = getIntegrationDefaultConfig('google_sheets') as any;

    expect(config1).toBeDefined();
    expect(config2).toBeDefined();

    config1.spreadsheetId = 'modified-sheet';
    config1.range = 'Sheet2!A1:Z100';

    expect(config2.spreadsheetId).not.toEqual('modified-sheet');
    expect(config2.range).not.toEqual('Sheet2!A1:Z100');
  });

  test('getIntegrationDefaultConfig returns independent copies for github', () => {
    const config1 = getIntegrationDefaultConfig('github') as any;
    const config2 = getIntegrationDefaultConfig('github') as any;

    expect(config1).toBeDefined();
    expect(config2).toBeDefined();

    config1.repo = 'modified/repo';
    config1.action = 'create_comment';

    expect(config2.repo).not.toEqual('modified/repo');
    expect(config2.action).not.toEqual('create_comment');
  });

  test('getIntegrationDefaultConfig returns independent copies for notion', () => {
    const config1 = getIntegrationDefaultConfig('notion') as any;
    const config2 = getIntegrationDefaultConfig('notion') as any;

    expect(config1).toBeDefined();
    expect(config2).toBeDefined();

    config1.databaseId = 'modified-db';
    config1.title = 'Modified Title';

    expect(config2.databaseId).not.toEqual('modified-db');
    expect(config2.title).not.toEqual('Modified Title');
  });

  test('getIntegrationDefaultConfig returns independent copies for airtable', () => {
    const config1 = getIntegrationDefaultConfig('airtable') as any;
    const config2 = getIntegrationDefaultConfig('airtable') as any;

    expect(config1).toBeDefined();
    expect(config2).toBeDefined();

    config1.baseId = 'modified-base';
    config1.tableId = 'modified-table';

    expect(config2.baseId).not.toEqual('modified-base');
    expect(config2.tableId).not.toEqual('modified-table');
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
