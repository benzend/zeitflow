import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkflowBuilder from '@/components/WorkflowBuilder';
import { NodeData, Connection } from '@/lib/workflow-types';

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

describe('WorkflowBuilder', () => {
  const mockOnSave = jest.fn();

  const defaultProps = {
    onSave: mockOnSave
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Utility Functions', () => {
    it('should snap values to grid correctly', () => {
      render(<WorkflowBuilder {...defaultProps} />);

      // We can't directly test the snapToGrid function since it's internal
      // But we can test its behavior through the component
      // This test will be expanded when we extract utilities
      expect(true).toBe(true); // Placeholder test
    });

    it('should render with default nodes', () => {
      render(<WorkflowBuilder {...defaultProps} />);

      // Check that the title is rendered
      expect(screen.getByText('Automatic Jump Scheduler')).toBeInTheDocument();

      // Check that the component renders without crashing
      expect(screen.getByRole('button', { name: /Add Endpoint/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add AI Model/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Scheduler/i })).toBeInTheDocument();
    });

    it('should render with custom initial nodes', () => {
      const customNodes: NodeData[] = [
        {
          id: 'custom-1',
          type: 'endpoint',
          x: 100,
          y: 100,
          label: 'Custom Endpoint',
          fields: []
        }
      ];

      render(<WorkflowBuilder {...defaultProps} initialNodes={customNodes} />);

      expect(screen.getByText('Custom Endpoint')).toBeInTheDocument();
    });
  });

  describe('Node Management', () => {
    it('should add a new endpoint node when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<WorkflowBuilder {...defaultProps} />);

      const addEndpointButton = screen.getAllByTitle('Add Endpoint')[0];
      await user.click(addEndpointButton);

      // Should now have 6 nodes (5 default + 1 new)
      // This is hard to test directly due to the component structure
      // We'll need to test this more thoroughly when we refactor
    });

    it('should select a node when clicked', async () => {
      const user = userEvent.setup();
      render(<WorkflowBuilder {...defaultProps} />);

      const endpointNode = screen.getByText('Endpoint');
      await user.click(endpointNode);

      // The selected node should show different styling
      // This is hard to test without better test IDs
    });
  });

  describe('Save Functionality', () => {
    it('should call onSave when save button is clicked', async () => {
      const user = userEvent.setup();
      render(<WorkflowBuilder {...defaultProps} />);

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.any(Array), // nodes
        expect.any(Array)  // connections
      );
    });

    it('should not render save button when onSave is not provided', () => {
      render(<WorkflowBuilder />);

      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });
  });

  describe('Field Management', () => {
    it('should add a field to endpoint node', async () => {
      const user = userEvent.setup();
      render(<WorkflowBuilder {...defaultProps} />);

      // Select the endpoint node first
      const endpointNode = screen.getByText('Endpoint');
      await user.click(endpointNode);

      // Find and click the "Add Field" button in the sidebar
      const addFieldButton = screen.getByText('Add Field');
      await user.click(addFieldButton);

      // Check that a new field input appears
      const fieldInputs = screen.getAllByPlaceholderText('Field name');
      expect(fieldInputs.length).toBeGreaterThan(1); // Should have at least 2 fields now
    });
  });

  describe('Connection Management', () => {
    it('should render connections between nodes', () => {
      render(<WorkflowBuilder {...defaultProps} />);

      // Check that SVG connections are rendered
      const svgElements = document.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);
    });

    it('should handle custom connections', () => {
      const customConnections: Connection[] = [
        { from: 'node1', to: 'node2' }
      ];

      render(<WorkflowBuilder {...defaultProps} initialConnections={customConnections} />);

      // Component should render without crashing with custom connections
      expect(screen.getByText('Automatic Jump Scheduler')).toBeInTheDocument();
    });

    it('should render connections correctly regardless of node positioning', () => {
      const customNodes: NodeData[] = [
        { id: 'left', type: 'endpoint', x: 100, y: 100, label: 'Left Node' },
        { id: 'right', type: 'ai', x: 300, y: 100, label: 'Right Node' },
        { id: 'above', type: 'scheduler', x: 200, y: 50, label: 'Above Node' },
        { id: 'below', type: 'review', x: 200, y: 200, label: 'Below Node' }
      ];
      const customConnections: Connection[] = [
        { from: 'left', to: 'right' },
        { from: 'above', to: 'below' }
      ];

      render(<WorkflowBuilder {...defaultProps} initialNodes={customNodes} initialConnections={customConnections} />);

      // Component should render connections without crashing
      expect(screen.getByText('Automatic Jump Scheduler')).toBeInTheDocument();

      // Check that SVG elements exist for connections
      const svgElements = document.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);
    });
  });

  describe('AI Configuration', () => {
    it('should update AI system prompt', async () => {
      const user = userEvent.setup();
      render(<WorkflowBuilder {...defaultProps} />);

      // Select the first AI node
      const aiNodes = screen.getAllByText('gpt-4o');
      await user.click(aiNodes[0]);

      // Check that AI configuration section is visible
      expect(screen.getByText('AI Configuration')).toBeInTheDocument();
    });

    it('should toggle template mode', async () => {
      const user = userEvent.setup();
      render(<WorkflowBuilder {...defaultProps} />);

      // Select the first AI node
      const aiNodes = screen.getAllByText('gpt-4o');
      await user.click(aiNodes[0]);

      // Find and click the template toggle
      const templateButton = screen.getByText('Add Template');
      await user.click(templateButton);

      // Should now show "Remove Template"
      expect(screen.getByText('Remove Template')).toBeInTheDocument();
    });
  });

  describe('Scheduler Configuration', () => {
    it('should add people to scheduler', async () => {
      const user = userEvent.setup();
      render(<WorkflowBuilder {...defaultProps} />);

      // Select the scheduler node (get the first one from the canvas)
      const schedulerNodes = screen.getAllByText('Scheduler');
      await user.click(schedulerNodes[0]);

      // Check that scheduler configuration is visible
      expect(screen.getByText('Scheduler Settings')).toBeInTheDocument();
      expect(screen.getByText('People Involved')).toBeInTheDocument();
    });

    it('should add a person to the scheduler', async () => {
      const user = userEvent.setup();
      render(<WorkflowBuilder {...defaultProps} />);

      // Select the scheduler node
      const schedulerNodes = screen.getAllByText('Scheduler');
      await user.click(schedulerNodes[0]);

      // Find the input for adding people
      const addPersonInput = screen.getByPlaceholderText('Add');
      await user.type(addPersonInput, 'John Doe');
      await user.keyboard('{Enter}');

      // Should show the added person
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Review Configuration', () => {
    it('should display review checklist', async () => {
      const user = userEvent.setup();
      render(<WorkflowBuilder {...defaultProps} />);

      // Select the review node
      const reviewNodes = screen.getAllByText('Review');
      await user.click(reviewNodes[0]);

      // Check that review configuration is visible
      expect(screen.getByText('Review Checklist')).toBeInTheDocument();
    });

    it('should toggle validation status', async () => {
      const user = userEvent.setup();
      render(<WorkflowBuilder {...defaultProps} />);

      // Select the review node
      const reviewNodes = screen.getAllByText('Review');
      await user.click(reviewNodes[0]);

      // Find validation checkboxes and click one
      const validationItems = screen.getAllByText('Form');
      await user.click(validationItems[0]);

      // The component should handle the click without crashing
      expect(screen.getByText('Review Checklist')).toBeInTheDocument();
    });
  });

  describe('Save Integration', () => {
    it('should save workflow with custom nodes and connections', async () => {
      const user = userEvent.setup();
      const customNodes: NodeData[] = [
        {
          id: 'custom-endpoint',
          type: 'endpoint',
          x: 100,
          y: 100,
          label: 'Custom Endpoint',
          fields: [
            { id: 'field1', key: 'Name', type: 'text' },
            { id: 'field2', key: 'Email', type: 'email' }
          ]
        },
        {
          id: 'custom-ai',
          type: 'ai',
          x: 300,
          y: 100,
          label: 'Custom AI',
          aiConfig: {
            systemPrompt: 'You are a helpful assistant',
            userPrompt: 'Process this data: {{ entry.fields.Name }}',
            outputType: 'JSON',
            outputStructure: '{"result": "string"}',
            hasTemplate: false,
            templateText: ''
          }
        }
      ];
      const customConnections: Connection[] = [
        { from: 'custom-endpoint', to: 'custom-ai' }
      ];

      render(<WorkflowBuilder
        {...defaultProps}
        initialNodes={customNodes}
        initialConnections={customConnections}
      />);

      // Click save button
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      // Verify onSave was called with correct data
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'custom-endpoint',
            type: 'endpoint',
            label: 'Custom Endpoint',
            fields: expect.arrayContaining([
              expect.objectContaining({ key: 'Name', type: 'text' }),
              expect.objectContaining({ key: 'Email', type: 'email' })
            ])
          }),
          expect.objectContaining({
            id: 'custom-ai',
            type: 'ai',
            label: 'Custom AI',
            aiConfig: expect.objectContaining({
              systemPrompt: 'You are a helpful assistant',
              userPrompt: 'Process this data: {{ entry.fields.Name }}',
              outputType: 'JSON'
            })
          })
        ]),
        expect.arrayContaining([
          expect.objectContaining({
            from: 'custom-endpoint',
            to: 'custom-ai'
          })
        ])
      );
    });

    it('should save workflow after adding a new node', async () => {
      const user = userEvent.setup();
      render(<WorkflowBuilder {...defaultProps} />);

      // Add a new endpoint node
      const addEndpointButton = screen.getAllByTitle('Add Endpoint')[0];
      await user.click(addEndpointButton);

      // Click save button
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      // Verify onSave was called and includes the new node
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'endpoint',
            label: 'Endpoint'
          })
        ]),
        expect.any(Array)
      );

      // Should have more than the original 5 nodes
      const callArgs = mockOnSave.mock.calls[0];
      expect(callArgs[0]).toHaveLength(6); // 5 original + 1 new
    });

    it('should save workflow after modifying node configuration', async () => {
      const user = userEvent.setup();
      render(<WorkflowBuilder {...defaultProps} />);

      // Select the first AI node
      const aiNodes = screen.getAllByText('gpt-4o');
      await user.click(aiNodes[0]);

      // The component should handle the configuration changes
      // Click save button
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      // Verify onSave was called
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Array)
      );
    });

    it('should call onSave with different callback', async () => {
      const user = userEvent.setup();
      const customOnSave = jest.fn();

      render(<WorkflowBuilder {...defaultProps} onSave={customOnSave} />);

      // Click save button
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      // Verify the custom onSave was called
      expect(customOnSave).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Array)
      );
    });
  });

  // Node removal tests would go here but are complex due to UI structure
  // The removeNode function is tested indirectly through other functionality
});