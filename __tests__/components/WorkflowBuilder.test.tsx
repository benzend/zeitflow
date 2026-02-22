import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkflowBuilderReactFlow from '@/components/WorkflowBuilderReactFlow';
import { NodeData } from '@/lib/workflow-types';

// Mock the svg-assets import
jest.mock('@/lib/svg-assets', () => ({
  svgPaths: {
    p17fb1d00: 'M21 331h8v8h-8z',
    p305c9380: 'M21 336h8v8h-8z',
    p6c6e700: 'M7 4l4 4-4 4z',
    p483a300: 'M20 368h16v16h-16z',
    p3c32d5f0: 'M23 20h16v16h-16z'
  },
  schedulerSvg: {
    p3eb57e80: 'M0 0L8 4L0 8z'
  },
  reviewSvg: {
    checkmark: 'M0.299998 3.6L2.96666 5.59997L6.16078 0.693011'
  }
}));

// Mock global fetch so the Slack bots request doesn't blow up in jsdom
beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    json: () => Promise.resolve({ success: true, bots: [] }),
  }) as jest.Mock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

/**
 * Render the builder and wait for the async Slack fetch to settle so we
 * don't get "act()" warnings from state updates after the test ends.
 */
async function renderBuilder(props?: React.ComponentProps<typeof WorkflowBuilderReactFlow>) {
  const result = render(<WorkflowBuilderReactFlow {...props} />);

  // Wait for the fetch('/api/slack/bots') useEffect to complete
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith('/api/slack/bots');
  });

  return result;
}

describe('WorkflowBuilderReactFlow', () => {
  const mockOnSave = jest.fn();

  const defaultNodes: NodeData[] = [
    {
      id: '1',
      type: 'entry',
      x: 100,
      y: 100,
      label: 'Entry',
      fields: [],
      entryType: 'endpoint'
    },
    {
      id: '2',
      type: 'ai',
      x: 300,
      y: 100,
      label: 'gpt-4o',
      aiConfig: {
        model: 'google/gemini-2.0-flash-001',
        systemPrompt: 'You are an expert PM that analyzes meeting notes.',
        userPrompt: '{{ entry.fields.notes }}',
        outputType: 'JSON',
        outputStructure: '{"takeaways": [{"text": "string"}], "next_steps": [{"text": "string"}]}'
      }
    }
  ];

  const defaultProps = {
    onSave: mockOnSave,
    initialNodes: defaultNodes,
    initialConnections: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-stub fetch after clearAllMocks
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, bots: [] }),
    }) as jest.Mock;
  });

  describe('Rendering', () => {
    it('renders the React Flow canvas', async () => {
      await renderBuilder(defaultProps);

      expect(screen.getByTestId('rf__wrapper')).toBeInTheDocument();
    });

    it('renders toolbar buttons', async () => {
      await renderBuilder(defaultProps);

      // The toolbar has icon-only buttons (Plus icon, Review icon, etc.)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('renders with custom initial nodes', async () => {
      const customNodes: NodeData[] = [
        {
          id: 'custom-1',
          type: 'entry',
          x: 100,
          y: 100,
          label: 'Custom Entry',
          fields: []
        }
      ];

      await renderBuilder({ ...defaultProps, initialNodes: customNodes });

      expect(screen.getByText('Custom Entry')).toBeInTheDocument();
    });

    it('fetches Slack bots on mount', async () => {
      await renderBuilder(defaultProps);

      expect(global.fetch).toHaveBeenCalledWith('/api/slack/bots');
    });
  });

  describe('Save Functionality (via imperative handle)', () => {
    // The component exposes save() via useImperativeHandle — the parent
    // page renders the Save button and calls ref.current.save().
    it('calls onSave when save() is invoked via ref', async () => {
      const ref = React.createRef<{ save: () => void; getCurrentState: () => unknown }>();

      render(
        <WorkflowBuilderReactFlow
          ref={ref}
          onSave={mockOnSave}
          initialNodes={defaultNodes}
          initialConnections={[]}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/slack/bots');
      });

      // Call save through the imperative handle
      ref.current?.save();

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.any(Array), // nodes
        expect.any(Array)  // connections
      );
    });

    it('does not throw when save() is called without onSave', async () => {
      const ref = React.createRef<{ save: () => void; getCurrentState: () => unknown }>();

      render(
        <WorkflowBuilderReactFlow
          ref={ref}
          initialNodes={defaultNodes}
          initialConnections={[]}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/slack/bots');
      });

      // Should not throw
      expect(() => ref.current?.save()).not.toThrow();
    });

    it('filters out invalid connections when saving', async () => {
      const localMockOnSave = jest.fn();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const ref = React.createRef<{ save: () => void; getCurrentState: () => unknown }>();

      const testNodes: NodeData[] = [
        {
          id: 'valid-node-1',
          type: 'entry',
          x: 100,
          y: 100,
          label: 'Entry',
          fields: []
        },
        {
          id: 'valid-node-2',
          type: 'ai',
          x: 300,
          y: 100,
          label: 'AI',
          aiConfig: {
            model: 'google/gemini-2.0-flash-001',
            systemPrompt: '',
            userPrompt: '',
            outputType: 'JSON',
            outputStructure: ''
          }
        }
      ];

      render(
        <WorkflowBuilderReactFlow
          ref={ref}
          onSave={localMockOnSave}
          initialNodes={testNodes}
          initialConnections={[
            { from: 'valid-node-1', to: 'valid-node-2' },
            { from: 'non-existent-node', to: 'valid-node-2' },
            { from: 'valid-node-1', to: 'non-existent-node' },
            { from: 'valid-node-1', to: 'valid-node-1' },
            { from: 'valid-node-1', to: 'valid-node-2' } // duplicate
          ]}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/slack/bots');
      });

      ref.current?.save();

      expect(localMockOnSave).toHaveBeenCalledTimes(1);
      const [savedNodes, savedConnections] = localMockOnSave.mock.calls[0];

      expect(savedNodes).toHaveLength(2);
      expect(savedConnections).toHaveLength(1);
      expect(savedConnections[0]).toEqual({ from: 'valid-node-1', to: 'valid-node-2' });

      expect(consoleWarnSpy).toHaveBeenCalledWith('Filtering out invalid connection: non-existent-node -> valid-node-2');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Filtering out invalid connection: valid-node-1 -> non-existent-node');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Filtering out self-referencing connection: valid-node-1 -> valid-node-1');

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Skipped (React Flow internals)', () => {
    it.skip('should add a field to entry node', () => {});
    it.skip('should render connections between nodes', () => {});
    it.skip('should handle custom connections', () => {});
    it.skip('should update AI system prompt', () => {});
    it.skip('should toggle template mode', () => {});
    it.skip('should update AI configuration and save', () => {});
    it.skip('should configure scheduler settings', () => {});
    it.skip('should mark validation steps as complete', () => {});
    it.skip('should confirm meeting scheduled', () => {});
  });
});
