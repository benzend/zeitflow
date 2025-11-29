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
  });
});