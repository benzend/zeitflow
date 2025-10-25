import { snapToGrid, getNodeWidth, getNodeIcon, generateNodeId, generateFieldId } from '@/lib/workflow-utils';
import { NodeData } from '@/lib/workflow-types';

describe('Workflow Utils', () => {
  describe('snapToGrid', () => {
    it('should snap values to the nearest grid point with default grid size', () => {
      expect(snapToGrid(15)).toBe(20);
      expect(snapToGrid(25)).toBe(20);
      expect(snapToGrid(35)).toBe(40);
      expect(snapToGrid(10)).toBe(20);
    });

    it('should snap values to the nearest grid point with custom grid size', () => {
      expect(snapToGrid(15, 10)).toBe(20);
      expect(snapToGrid(25, 10)).toBe(30);
      expect(snapToGrid(35, 10)).toBe(40);
    });

    it('should handle exact grid values', () => {
      expect(snapToGrid(20)).toBe(20);
      expect(snapToGrid(40)).toBe(40);
      expect(snapToGrid(0)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(snapToGrid(-15)).toBe(-20);
      expect(snapToGrid(-25)).toBe(-20);
    });
  });

  describe('getNodeWidth', () => {
    it('should return correct width for endpoint nodes', () => {
      expect(getNodeWidth('endpoint')).toBe(98);
    });

    it('should return correct width for ai nodes', () => {
      expect(getNodeWidth('ai')).toBe(89);
    });

    it('should return correct width for scheduler nodes', () => {
      expect(getNodeWidth('scheduler')).toBe(103);
    });

    it('should return correct width for review nodes', () => {
      expect(getNodeWidth('review')).toBe(89);
    });

    it('should return default width for unknown node types', () => {
      expect(getNodeWidth('unknown')).toBe(89);
    });
  });

  describe('getNodeIcon', () => {
    it('should return correct icon for endpoint nodes', () => {
      const node: NodeData = {
        id: '1',
        type: 'endpoint',
        x: 0,
        y: 0,
        label: 'Test'
      };
      expect(getNodeIcon(node)).toBe('Form');
    });

    it('should return correct icon for ai nodes', () => {
      const node: NodeData = {
        id: '1',
        type: 'ai',
        x: 0,
        y: 0,
        label: 'Test'
      };
      expect(getNodeIcon(node)).toBe('AI');
    });

    it('should return correct icon for scheduler nodes', () => {
      const node: NodeData = {
        id: '1',
        type: 'scheduler',
        x: 0,
        y: 0,
        label: 'Test'
      };
      expect(getNodeIcon(node)).toBe('Scheduler');
    });

    it('should return correct icon for review nodes', () => {
      const node: NodeData = {
        id: '1',
        type: 'review',
        x: 0,
        y: 0,
        label: 'Test'
      };
      expect(getNodeIcon(node)).toBe('Review');
    });
  });

  describe('generateNodeId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateNodeId();
      const id2 = generateNodeId();

      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
      expect(typeof id2).toBe('string');
      expect(id2.length).toBeGreaterThan(0);
    });

    it('should generate valid UUIDs', () => {
      const id = generateNodeId();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('generateFieldId', () => {
    it('should generate unique field IDs', () => {
      const id1 = generateFieldId();
      const id2 = generateFieldId();

      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('should generate valid UUIDs for fields', () => {
      const id = generateFieldId();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });
});