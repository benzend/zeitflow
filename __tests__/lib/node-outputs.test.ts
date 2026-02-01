import { getNodeOutputs, getAvailableVariables } from '@/lib/node-outputs';
import { NodeData, Field } from '@/lib/workflow-types';

describe('labelToVariableName', () => {
  // Testing the private function indirectly through getNodeOutputs

  it('converts simple labels to lowercase', () => {
    const node: NodeData = {
      id: 'test-1',
      type: 'entry',
      label: 'UserData',
      position: { x: 0, y: 0 },
      fields: [{ key: 'email', label: 'Email', type: 'text' }],
    };

    const outputs = getNodeOutputs(node);
    expect(outputs[0].key).toBe('userdata.email');
  });

  it('converts labels with spaces to underscores', () => {
    const node: NodeData = {
      id: 'test-2',
      type: 'entry',
      label: 'New Ticket',
      position: { x: 0, y: 0 },
      fields: [{ key: 'title', label: 'Title', type: 'text' }],
    };

    const outputs = getNodeOutputs(node);
    expect(outputs[0].key).toBe('new_ticket.title');
  });

  it('converts labels with hyphens to underscores', () => {
    const node: NodeData = {
      id: 'test-3',
      type: 'entry',
      label: 'User-Data',
      position: { x: 0, y: 0 },
      fields: [{ key: 'name', label: 'Name', type: 'text' }],
    };

    const outputs = getNodeOutputs(node);
    expect(outputs[0].key).toBe('user_data.name');
  });

  it('removes special characters', () => {
    const node: NodeData = {
      id: 'test-4',
      type: 'entry',
      label: 'Send Email!!!',
      position: { x: 0, y: 0 },
      fields: [{ key: 'status', label: 'Status', type: 'text' }],
    };

    const outputs = getNodeOutputs(node);
    expect(outputs[0].key).toBe('send_email.status');
  });

  it('removes leading and trailing underscores', () => {
    const node: NodeData = {
      id: 'test-5',
      type: 'entry',
      label: '___Test___',
      position: { x: 0, y: 0 },
      fields: [{ key: 'data', label: 'Data', type: 'text' }],
    };

    const outputs = getNodeOutputs(node);
    expect(outputs[0].key).toBe('test.data');
  });

  it('handles mixed special characters', () => {
    const node: NodeData = {
      id: 'test-6',
      type: 'entry',
      label: 'Analyze-Ticket!',
      position: { x: 0, y: 0 },
      fields: [{ key: 'result', label: 'Result', type: 'text' }],
    };

    const outputs = getNodeOutputs(node);
    expect(outputs[0].key).toBe('analyze_ticket.result');
  });

  it('handles empty label gracefully', () => {
    const node: NodeData = {
      id: 'test-7',
      type: 'entry',
      label: '',
      position: { x: 0, y: 0 },
      fields: [{ key: 'field1', label: 'Field 1', type: 'text' }],
    };

    const outputs = getNodeOutputs(node);
    expect(outputs[0].key).toBe('.field1');
  });

  it('handles only spaces in label', () => {
    const node: NodeData = {
      id: 'test-8',
      type: 'entry',
      label: '   ',
      position: { x: 0, y: 0 },
      fields: [{ key: 'field1', label: 'Field 1', type: 'text' }],
    };

    const outputs = getNodeOutputs(node);
    expect(outputs[0].key).toBe('.field1');
  });

  it('handles very long labels', () => {
    const node: NodeData = {
      id: 'test-9',
      type: 'entry',
      label: 'A'.repeat(100),
      position: { x: 0, y: 0 },
      fields: [{ key: 'data', label: 'Data', type: 'text' }],
    };

    const outputs = getNodeOutputs(node);
    expect(outputs[0].key).toBe(`${'a'.repeat(100)}.data`);
  });
});

describe('getNodeOutputs', () => {
  describe('entry nodes', () => {
    it('returns outputs for all configured fields', () => {
      const node: NodeData = {
        id: 'entry-1',
        type: 'entry',
        label: 'New Ticket',
        position: { x: 0, y: 0 },
        fields: [
          { key: 'customer_name', label: 'Customer Name', type: 'text' },
          { key: 'customer_email', label: 'Email', type: 'email' },
          { key: 'issue', label: 'Issue Description', type: 'textarea' },
        ],
      };

      const outputs = getNodeOutputs(node);

      expect(outputs).toHaveLength(3);
      expect(outputs[0]).toEqual({
        key: 'new_ticket.customer_name',
        label: 'Customer Name',
        description: 'New Ticket - text field',
        nodeId: 'entry-1',
      });
      expect(outputs[1]).toEqual({
        key: 'new_ticket.customer_email',
        label: 'Email',
        description: 'New Ticket - email field',
        nodeId: 'entry-1',
      });
      expect(outputs[2]).toEqual({
        key: 'new_ticket.issue',
        label: 'Issue Description',
        description: 'New Ticket - textarea field',
        nodeId: 'entry-1',
      });
    });

    it('returns empty array for entry node with no fields', () => {
      const node: NodeData = {
        id: 'entry-2',
        type: 'entry',
        label: 'Empty Entry',
        position: { x: 0, y: 0 },
        fields: [],
      };

      const outputs = getNodeOutputs(node);
      expect(outputs).toEqual([]);
    });

    it('uses field key as label if label is missing', () => {
      const node: NodeData = {
        id: 'entry-3',
        type: 'entry',
        label: 'Test Entry',
        position: { x: 0, y: 0 },
        fields: [
          { key: 'field1', type: 'text' } as Field,
        ],
      };

      const outputs = getNodeOutputs(node);
      expect(outputs[0].label).toBe('field1');
    });
  });

  describe('ai nodes', () => {
    it('returns single output field for AI node', () => {
      const node: NodeData = {
        id: 'ai-1',
        type: 'ai',
        label: 'Analyze Ticket',
        position: { x: 0, y: 0 },
      };

      const outputs = getNodeOutputs(node);

      expect(outputs).toHaveLength(1);
      expect(outputs[0]).toEqual({
        key: 'analyze_ticket.output',
        label: 'AI Output',
        description: 'Analyze Ticket - Generated text from AI',
        nodeId: 'ai-1',
      });
    });
  });

  describe('scheduler nodes', () => {
    it('returns three output fields for scheduler node', () => {
      const node: NodeData = {
        id: 'scheduler-1',
        type: 'scheduler',
        label: 'Schedule Meeting',
        position: { x: 0, y: 0 },
      };

      const outputs = getNodeOutputs(node);

      expect(outputs).toHaveLength(3);
      expect(outputs.map(o => o.key)).toEqual([
        'schedule_meeting.eventId',
        'schedule_meeting.eventLink',
        'schedule_meeting.scheduledTime',
      ]);
    });
  });

  describe('review nodes', () => {
    it('returns two output fields for review node', () => {
      const node: NodeData = {
        id: 'review-1',
        type: 'review',
        label: 'Approve Draft',
        position: { x: 0, y: 0 },
      };

      const outputs = getNodeOutputs(node);

      expect(outputs).toHaveLength(2);
      expect(outputs.map(o => o.key)).toEqual([
        'approve_draft.approved',
        'approve_draft.feedback',
      ]);
    });
  });

  describe('email nodes', () => {
    it('returns two output fields for email node', () => {
      const node: NodeData = {
        id: 'email-1',
        type: 'email',
        label: 'Send Notification',
        position: { x: 0, y: 0 },
      };

      const outputs = getNodeOutputs(node);

      expect(outputs).toHaveLength(2);
      expect(outputs.map(o => o.key)).toEqual([
        'send_notification.messageId',
        'send_notification.status',
      ]);
    });
  });

  describe('slack nodes', () => {
    it('returns three output fields for slack node', () => {
      const node: NodeData = {
        id: 'slack-1',
        type: 'slack',
        label: 'Post to Channel',
        position: { x: 0, y: 0 },
      };

      const outputs = getNodeOutputs(node);

      expect(outputs).toHaveLength(3);
      expect(outputs.map(o => o.key)).toEqual([
        'post_to_channel.messageId',
        'post_to_channel.channel',
        'post_to_channel.timestamp',
      ]);
    });
  });

  describe('sms nodes', () => {
    it('returns two output fields for SMS node', () => {
      const node: NodeData = {
        id: 'sms-1',
        type: 'sms',
        label: 'Send Alert',
        position: { x: 0, y: 0 },
      };

      const outputs = getNodeOutputs(node);

      expect(outputs).toHaveLength(2);
      expect(outputs.map(o => o.key)).toEqual([
        'send_alert.messageId',
        'send_alert.status',
      ]);
    });
  });

  describe('telegram nodes', () => {
    it('returns two output fields for Telegram node', () => {
      const node: NodeData = {
        id: 'telegram-1',
        type: 'telegram',
        label: 'Send Message',
        position: { x: 0, y: 0 },
      };

      const outputs = getNodeOutputs(node);

      expect(outputs).toHaveLength(2);
      expect(outputs.map(o => o.key)).toEqual([
        'send_message.messageId',
        'send_message.chatId',
      ]);
    });
  });

  describe('condition nodes', () => {
    it('returns three output fields for condition node', () => {
      const node: NodeData = {
        id: 'condition-1',
        type: 'condition',
        label: 'Check Urgency',
        position: { x: 0, y: 0 },
      };

      const outputs = getNodeOutputs(node);

      expect(outputs).toHaveLength(3);
      expect(outputs.map(o => o.key)).toEqual([
        'check_urgency.result',
        'check_urgency.leftValue',
        'check_urgency.rightValue',
      ]);
    });
  });
});

describe('getAvailableVariables', () => {
  it('returns empty array for node with no incoming connections', () => {
    const nodes: NodeData[] = [
      {
        id: 'node-1',
        type: 'entry',
        label: 'Entry',
        position: { x: 0, y: 0 },
        fields: [{ key: 'field1', label: 'Field 1', type: 'text' }],
      },
    ];
    const connections = [];

    const vars = getAvailableVariables('node-1', nodes, connections);
    expect(vars).toEqual([]);
  });

  it('returns outputs from single upstream node', () => {
    const nodes: NodeData[] = [
      {
        id: 'entry-1',
        type: 'entry',
        label: 'New Ticket',
        position: { x: 0, y: 0 },
        fields: [{ key: 'name', label: 'Name', type: 'text' }],
      },
      {
        id: 'ai-1',
        type: 'ai',
        label: 'Analyze',
        position: { x: 100, y: 0 },
      },
    ];
    const connections = [{ from: 'entry-1', to: 'ai-1' }];

    const vars = getAvailableVariables('ai-1', nodes, connections);

    expect(vars).toHaveLength(1);
    expect(vars[0].key).toBe('new_ticket.name');
  });

  it('returns outputs from multiple upstream nodes', () => {
    const nodes: NodeData[] = [
      {
        id: 'entry-1',
        type: 'entry',
        label: 'Ticket',
        position: { x: 0, y: 0 },
        fields: [{ key: 'issue', label: 'Issue', type: 'text' }],
      },
      {
        id: 'ai-1',
        type: 'ai',
        label: 'Categorize',
        position: { x: 100, y: 0 },
      },
      {
        id: 'ai-2',
        type: 'ai',
        label: 'Prioritize',
        position: { x: 100, y: 100 },
      },
      {
        id: 'email-1',
        type: 'email',
        label: 'Send Email',
        position: { x: 200, y: 50 },
      },
    ];
    const connections = [
      { from: 'entry-1', to: 'ai-1' },
      { from: 'entry-1', to: 'ai-2' },
      { from: 'ai-1', to: 'email-1' },
      { from: 'ai-2', to: 'email-1' },
    ];

    const vars = getAvailableVariables('email-1', nodes, connections);

    expect(vars).toHaveLength(3); // ticket.issue, categorize.output, prioritize.output
    expect(vars.map(v => v.key)).toContain('ticket.issue');
    expect(vars.map(v => v.key)).toContain('categorize.output');
    expect(vars.map(v => v.key)).toContain('prioritize.output');
  });

  it('recursively finds all upstream nodes', () => {
    const nodes: NodeData[] = [
      { id: 'entry-1', type: 'entry', label: 'Entry', position: { x: 0, y: 0 }, fields: [{ key: 'f1', label: 'F1', type: 'text' }] },
      { id: 'ai-1', type: 'ai', label: 'AI1', position: { x: 100, y: 0 } },
      { id: 'ai-2', type: 'ai', label: 'AI2', position: { x: 200, y: 0 } },
      { id: 'email-1', type: 'email', label: 'Email', position: { x: 300, y: 0 } },
    ];
    const connections = [
      { from: 'entry-1', to: 'ai-1' },
      { from: 'ai-1', to: 'ai-2' },
      { from: 'ai-2', to: 'email-1' },
    ];

    const vars = getAvailableVariables('email-1', nodes, connections);

    // Should include entry.f1, ai1.output, ai2.output
    expect(vars).toHaveLength(3);
    expect(vars.map(v => v.key)).toContain('entry.f1');
    expect(vars.map(v => v.key)).toContain('ai1.output');
    expect(vars.map(v => v.key)).toContain('ai2.output');
  });

  it('does not include downstream nodes', () => {
    const nodes: NodeData[] = [
      { id: 'entry-1', type: 'entry', label: 'Entry', position: { x: 0, y: 0 }, fields: [{ key: 'f1', label: 'F1', type: 'text' }] },
      { id: 'ai-1', type: 'ai', label: 'AI1', position: { x: 100, y: 0 } },
      { id: 'email-1', type: 'email', label: 'Email', position: { x: 200, y: 0 } },
    ];
    const connections = [
      { from: 'entry-1', to: 'ai-1' },
      { from: 'ai-1', to: 'email-1' },
    ];

    const vars = getAvailableVariables('ai-1', nodes, connections);

    // Should only include entry.f1, not email outputs
    expect(vars).toHaveLength(1);
    expect(vars[0].key).toBe('entry.f1');
  });

  it('handles cycles gracefully', () => {
    const nodes: NodeData[] = [
      { id: 'ai-1', type: 'ai', label: 'AI1', position: { x: 0, y: 0 } },
      { id: 'ai-2', type: 'ai', label: 'AI2', position: { x: 100, y: 0 } },
    ];
    const connections = [
      { from: 'ai-1', to: 'ai-2' },
      { from: 'ai-2', to: 'ai-1' }, // Cycle
    ];

    // Should not infinite loop
    const vars = getAvailableVariables('ai-2', nodes, connections);

    expect(vars).toHaveLength(2); // Both nodes' outputs
  });

  it('handles diamond-shaped graphs', () => {
    const nodes: NodeData[] = [
      { id: 'entry-1', type: 'entry', label: 'Entry', position: { x: 0, y: 0 }, fields: [{ key: 'f1', label: 'F1', type: 'text' }] },
      { id: 'ai-1', type: 'ai', label: 'AI1', position: { x: 100, y: 0 } },
      { id: 'ai-2', type: 'ai', label: 'AI2', position: { x: 100, y: 100 } },
      { id: 'email-1', type: 'email', label: 'Email', position: { x: 200, y: 50 } },
    ];
    const connections = [
      { from: 'entry-1', to: 'ai-1' },
      { from: 'entry-1', to: 'ai-2' },
      { from: 'ai-1', to: 'email-1' },
      { from: 'ai-2', to: 'email-1' },
    ];

    const vars = getAvailableVariables('email-1', nodes, connections);

    // Should include all three upstream nodes, no duplicates
    expect(vars).toHaveLength(3);
    const keys = vars.map(v => v.key);
    expect(keys).toContain('entry.f1');
    expect(keys).toContain('ai1.output');
    expect(keys).toContain('ai2.output');
  });
});
