import { parseWorkflowFromText } from './lib/workflow-parser.ts';

console.log('Testing workflow parser...');

const text = `workflow:
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

try {
  console.log('Calling parseWorkflowFromText...');
  const result = parseWorkflowFromText(text);
  console.log('Result:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Error:', error);
}