import { parseWorkflowFromText } from '@/lib/workflow-parser';

describe('Workflow Parser', () => {
  describe('parseWorkflowFromText', () => {
    it('should parse a basic workflow with form and AI nodes', () => {
      const text = `
Here's a workflow for you:

workflow:
  name: Test Workflow
  description: A simple test workflow
  nodes:
     - type: form
       fields:
         - name: notes
           label: Notes
           type: textarea
           required: true
     - type: ai
       systemPrompt: You are a helpful assistant
       model: gpt-3.5-turbo
`;

      const result = parseWorkflowFromText(text);

      expect(result.workflow).toBeTruthy();
      expect(result.workflow!.name).toBe('Test Workflow');
      expect(result.workflow!.description).toBe('A simple test workflow');
      expect(result.workflow!.nodes).toHaveLength(2);
      expect(result.workflow!.connections).toHaveLength(1);

      // Check first node (form)
      const formNode = result.workflow!.nodes[0];
      expect(formNode.type).toBe('entry');
      expect(formNode.fields).toHaveLength(1);
      expect(formNode.fields![0].name).toBe('notes');

      // Check second node (AI)
      const aiNode = result.workflow!.nodes[1];
      expect(aiNode.type).toBe('ai');
      expect(aiNode.aiConfig?.systemPrompt).toBe('You are a helpful assistant');
    });

    it('should return null when no workflow syntax is found', () => {
      const text = 'This is just regular text with no workflow syntax.';
      const result = parseWorkflowFromText(text);

      expect(result.workflow).toBeNull();
    });

    it('should handle parsing errors gracefully', () => {
      const text = `
workflow:
  name:
  nodes:
    - type: invalid
`;

      const result = parseWorkflowFromText(text);

      expect(result.workflow).toBeNull();
      expect(result.error).toBeTruthy();
    });

    it('should require a workflow name', () => {
      const text = `
workflow:
  description: No name provided
  nodes:
    - type: ai
      systemPrompt: Test
`;

      const result = parseWorkflowFromText(text);

      expect(result.workflow).toBeNull();
      expect(result.error).toContain('name is required');
    });

    it('should require at least one node', () => {
      const text = `
workflow:
  name: Empty Workflow
  nodes:
`;

      const result = parseWorkflowFromText(text);

      expect(result.workflow).toBeNull();
      expect(result.error).toContain('at least one node');
    });

    describe('Node Validation', () => {
      it('should validate entry nodes require fields', () => {
        const text = `
workflow:
  name: Invalid Entry
  nodes:
    - type: entry
`;

        const result = parseWorkflowFromText(text);

        expect(result.workflow).toBeNull();
        expect(result.error).toContain('ERROR in node 1: Entry nodes require at least one field');
      });

      it('should validate entry field names', () => {
        const text = `
workflow:
  name: Invalid Field
  nodes:
    - type: entry
      fields:
        - label: No Name
          type: text
`;

        const result = parseWorkflowFromText(text);

        expect(result.workflow).toBeNull();
        expect(result.error).toContain('ERROR in node 1: Entry field 1 requires a name property');
      });

      it('should validate AI nodes require systemPrompt', () => {
        const text = `
workflow:
  name: Invalid AI
  nodes:
    - type: ai
      model: gpt-3.5-turbo
`;

        const result = parseWorkflowFromText(text);

        expect(result.workflow).toBeNull();
        expect(result.error).toContain('ERROR in node 1: AI nodes require a systemPrompt');
      });

      it('should validate scheduler nodes require required properties', () => {
        const text = `
workflow:
  name: Invalid Scheduler
  nodes:
    - type: scheduler
      people: ["test@example.com"]
`;

        const result = parseWorkflowFromText(text);

        expect(result.workflow).toBeNull();
        expect(result.error).toContain('ERROR in node 1: Scheduler nodes require minTimeRequirement');
      });

      it('should validate slack nodes require channel', () => {
        const text = `
workflow:
  name: Invalid Slack
  nodes:
    - type: slack
`;

        const result = parseWorkflowFromText(text);

        expect(result.workflow).toBeNull();
        expect(result.error).toContain('ERROR in node 1: Slack nodes require a channel');
      });

      it('should reject invalid node types', () => {
        const text = `
workflow:
  name: Invalid Type
  nodes:
    - type: nonexistent
`;

        const result = parseWorkflowFromText(text);

        expect(result.workflow).toBeNull();
        expect(result.error).toContain('ERROR: Failed to parse any valid nodes. Check that each node has a valid type and required properties.');
      });
    });

    describe('Variable Defaults', () => {
      it('should use dynamic field references for AI userPrompt', () => {
        const text = `
workflow:
  name: Dynamic Variables
  nodes:
    - type: entry
      fields:
        - name: custom_field
          label: Custom Field
          type: text
    - type: ai
      systemPrompt: Process the custom field
`;

        const result = parseWorkflowFromText(text);

        expect(result.workflow).toBeTruthy();
        const aiNode = result.workflow!.nodes[1];
        expect(aiNode.aiConfig?.userPrompt).toBe('{{ entry.fields.custom_field }}');
      });

      it('should fallback to previousOutput when no entry fields', () => {
        const text = `
workflow:
  name: No Entry Fields
  nodes:
    - type: ai
      systemPrompt: Just process something
`;

        const result = parseWorkflowFromText(text);

        expect(result.workflow).toBeTruthy();
        const aiNode = result.workflow!.nodes[0];
        expect(aiNode.aiConfig?.userPrompt).toBe('{{ previousOutput }}');
      });
    });

    describe('Error Messages', () => {
      it('should provide specific error messages for workflow name', () => {
        const text = `
workflow:
  description: No name here
  nodes:
    - type: ai
      systemPrompt: Test
`;

        const result = parseWorkflowFromText(text);

        expect(result.workflow).toBeNull();
        expect(result.error).toContain('ERROR: Workflow name is required and must be a string. Example: name: My Workflow');
      });

      it('should provide helpful example for missing nodes', () => {
        const text = `
workflow:
  name: No Nodes
`;

        const result = parseWorkflowFromText(text);

        expect(result.workflow).toBeNull();
        expect(result.error).toContain('ERROR: Workflow must have at least one node. Example:');
        expect(result.error).toContain('type: entry');
      });
    });
  });
});