/**
 * Codegen consistency tests
 *
 * Ensures the generated CLI code (cli/src/generated.rs) stays in sync with
 * the TypeScript sources of truth. If this test fails, run `pnpm codegen`.
 */

import * as fs from 'fs';
import * as path from 'path';
import { NODE_CONFIGS, NODE_TYPES } from '@/lib/node-registry';
import { AI_MODELS } from '@/lib/constants';
import { getAllIntegrations, getIntegrationIds } from '@/lib/integrations/registry';
import { INTEGRATION_CONFIG_KEYS } from '@/lib/integrations/types';

const GENERATED_RS_PATH = path.resolve(__dirname, '../../cli/src/generated.rs');

describe('Codegen — generated.rs consistency', () => {
  let generatedContent: string;

  beforeAll(() => {
    generatedContent = fs.readFileSync(GENERATED_RS_PATH, 'utf-8');
  });

  test('generated.rs file exists', () => {
    expect(fs.existsSync(GENERATED_RS_PATH)).toBe(true);
  });

  test('contains all node types from NODE_TYPES', () => {
    for (const nodeType of NODE_TYPES) {
      expect(generatedContent).toContain(`"${nodeType}"`);
    }
  });

  test('VALID_NODE_TYPES line has exactly the right node types', () => {
    const match = generatedContent.match(
      /pub const VALID_NODE_TYPES: &\[&str\] = &\[([^\]]+)\]/
    );
    expect(match).not.toBeNull();

    const rustTypes = match![1]
      .split(',')
      .map((s) => s.trim().replace(/"/g, ''));
    const tsTypes = [...NODE_TYPES] as string[];

    expect(rustTypes).toEqual(tsTypes);
  });

  test('config_key_for_type covers all node types with configs', () => {
    for (const nodeType of NODE_TYPES) {
      const config = NODE_CONFIGS[nodeType as keyof typeof NODE_CONFIGS];
      if (config.configKey) {
        expect(generatedContent).toContain(
          `"${nodeType}" => Some("${config.configKey}")`
        );
      }
    }
  });

  test('ALL_CONFIG_KEYS matches node registry config keys', () => {
    const match = generatedContent.match(
      /pub const ALL_CONFIG_KEYS: &\[&str\] = &\[([^\]]+)\]/
    );
    expect(match).not.toBeNull();

    const rustKeys = match![1]
      .split(',')
      .map((s) => s.trim().replace(/"/g, ''));

    const tsKeys = Object.values(NODE_CONFIGS)
      .map((c) => c.configKey)
      .filter((k): k is string => k !== null);

    expect(rustKeys).toEqual(tsKeys);
  });

  test('contains all integration IDs', () => {
    const integrationIds = Object.keys(INTEGRATION_CONFIG_KEYS);
    for (const id of integrationIds) {
      expect(generatedContent).toContain(`id: "${id}"`);
    }
  });

  test('INTEGRATION_IDS line has exactly the right IDs', () => {
    const match = generatedContent.match(
      /pub const INTEGRATION_IDS: &\[&str\] = &\[([^\]]+)\]/
    );
    expect(match).not.toBeNull();

    const rustIds = match![1]
      .split(',')
      .map((s) => s.trim().replace(/"/g, ''));

    const tsIds = Object.keys(INTEGRATION_CONFIG_KEYS);
    expect(rustIds).toEqual(tsIds);
  });

  test('integration metadata matches definitions', () => {
    const integrations = getAllIntegrations();
    for (const integration of integrations) {
      expect(generatedContent).toContain(`id: "${integration.id}"`);
      expect(generatedContent).toContain(`name: "${integration.name}"`);
      expect(generatedContent).toContain(
        `description: "${integration.description}"`
      );
      expect(generatedContent).toContain(
        `category: "${integration.category}"`
      );
    }
  });

  test('integration config fields match defaultConfig keys', () => {
    const integrations = getAllIntegrations();
    for (const integration of integrations) {
      if (integration.defaultConfig) {
        const fields = Object.keys(
          integration.defaultConfig as Record<string, unknown>
        );
        for (const field of fields) {
          expect(generatedContent).toContain(`"${field}"`);
        }
      }
    }
  });

  test('contains all AI models', () => {
    for (const model of AI_MODELS) {
      expect(generatedContent).toContain(`value: "${model.value}"`);
      expect(generatedContent).toContain(`label: "${model.label}"`);
    }
  });

  test('AI_MODELS array has exactly the right models', () => {
    const modelMatches = [
      ...generatedContent.matchAll(
        /AiModel \{ value: "([^"]+)", label: "([^"]+)" \}/g
      ),
    ];

    expect(modelMatches.length).toBe(AI_MODELS.length);

    for (let i = 0; i < AI_MODELS.length; i++) {
      expect(modelMatches[i][1]).toBe(AI_MODELS[i].value);
      expect(modelMatches[i][2]).toBe(AI_MODELS[i].label);
    }
  });

  test('generated file has DO NOT EDIT header', () => {
    expect(generatedContent).toContain('AUTO-GENERATED FILE');
    expect(generatedContent).toContain('DO NOT EDIT');
    expect(generatedContent).toContain('pnpm codegen');
  });
});

describe('Codegen — MCP NODE_TYPE_ENUM consistency', () => {
  let mcpContent: string;

  beforeAll(() => {
    const mcpPath = path.resolve(__dirname, '../../mcp/create-server.ts');
    mcpContent = fs.readFileSync(mcpPath, 'utf-8');
  });

  test('MCP does not have hardcoded NODE_TYPE_ENUM array', () => {
    // The MCP should derive NODE_TYPE_ENUM from NODE_TYPES, not hardcode it.
    // If this fails, the MCP has a hardcoded array that will go stale.
    expect(mcpContent).not.toMatch(
      /const NODE_TYPE_ENUM\s*=\s*\[\s*"entry"/
    );
  });

  test('MCP derives NODE_TYPE_ENUM from NODE_TYPES', () => {
    expect(mcpContent).toContain('NODE_TYPES as unknown as');
  });
});
