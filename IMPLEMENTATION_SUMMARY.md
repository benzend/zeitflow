# Node Renaming & Output Schema Implementation

## Overview

This implementation adds two critical features to the workflow builder:

1. **Node Renaming** - Users can now rename nodes directly in the workflow editor
2. **Node Output Schema** - Clear definition of what outputs each node type provides for variable references

## Changes Made

### 1. New File: `lib/node-outputs.ts`

Created a comprehensive output schema system that defines:

- **`getNodeOutputs(node: NodeData): OutputField[]`** - Returns all output fields for a given node
- **`getAvailableVariables(currentNodeId, allNodes, connections)`** - Returns all variables available to a node based on upstream nodes

#### Output Fields by Node Type:

| Node Type | Output Fields |
|-----------|---------------|
| **Entry** | All configured fields (e.g., `entry-1.customer_name`, `entry-1.email`) |
| **AI** | `ai-1.output` (generated text) |
| **Scheduler** | `scheduler-1.eventId`, `scheduler-1.eventLink`, `scheduler-1.scheduledTime` |
| **Review** | `review-1.approved`, `review-1.feedback` |
| **Email** | `email-1.messageId`, `email-1.status` |
| **Slack** | `slack-1.messageId`, `slack-1.channel`, `slack-1.timestamp` |
| **SMS** | `sms-1.messageId`, `sms-1.status` |
| **Telegram** | `telegram-1.messageId`, `telegram-1.chatId` |
| **Condition** | `condition-1.result`, `condition-1.leftValue`, `condition-1.rightValue` |

**Key Feature:** Variables now use `{{node-id.field}}` syntax (e.g., `{{ai-1.output}}`), making references stable even when node labels change.

### 2. Updated: `components/WorkflowBuilderReactFlow.tsx`

#### Imports Added:
```typescript
import { getAvailableVariables, OutputField } from '@/lib/node-outputs';
import { TelegramConfig, ConditionConfig } from '@/lib/workflow-types';
```

#### Updated `getFieldSuggestions` Function:
- Now uses the new `getAvailableVariables()` system
- Converts React Flow nodes to `NodeData` format
- Returns suggestions with proper `node-id.field` syntax
- Includes descriptions for each output field

#### Added "Node Label" Input Field:
Added editable label field to **all** node configuration panels:

**Entry Nodes:**
```tsx
<div className="mb-[16px]">
  <label className="block text-foreground-light text-[14px] font-medium mb-[8px]">
    Node Label
  </label>
  <div className="bg-background-extra-light border-border border-[0.5px] h-[32px] rounded-[8px] overflow-hidden">
    <input
      type="text"
      value={selectedNodeData.label || ''}
      onChange={(e) => updateNodeData(selectedNode!, { label: e.target.value })}
      placeholder="Enter node label"
      className="bg-transparent h-full w-full px-[12px] text-[12px] text-foreground placeholder-text-placeholder outline-none"
    />
  </div>
</div>
```

Applied to:
- Entry nodes (line ~1187)
- AI nodes (line ~1362)
- Scheduler nodes (line ~1450)
- Review nodes (line ~1554)
- Integration nodes (email, slack, sms, telegram, condition) (line ~1690)

### 3. Updated: `lib/reactflow-types.ts`

Fixed type compatibility issue:
```typescript
connections: edges.map(edge => ({
  from: edge.source,
  to: edge.target,
  sourceHandle: edge.sourceHandle || undefined,  // Convert null to undefined
  targetHandle: edge.targetHandle || undefined   // Convert null to undefined
}))
```

## How It Works

### Variable Resolution Flow

1. **User types `{{` in a prompt field**
   - `TypeaheadTextarea` detects the trigger pattern
   - Calls `getFieldSuggestions(currentNodeId)`

2. **`getFieldSuggestions()` executes:**
   - Converts React Flow nodes to `NodeData` format
   - Converts edges to `Connection` format
   - Calls `getAvailableVariables(currentNodeId, nodes, connections)`

3. **`getAvailableVariables()` logic:**
   - Performs graph traversal to find all upstream nodes
   - For each upstream node, calls `getNodeOutputs(node)`
   - Returns aggregated list of available variables

4. **User sees autocomplete dropdown:**
   ```
   Variables
   ┌─────────────────────────────────────┐
   │ ai-1.output                         │
   │ AI Output - Generated text from AI  │
   ├─────────────────────────────────────┤
   │ entry-1.customer_name               │
   │ New Ticket - text field             │
   └─────────────────────────────────────┘
   ```

5. **User selects suggestion:**
   - `{{ai-1.output}}` inserted into text field
   - Variable will resolve during workflow execution

### Node Renaming Flow

1. **User selects a node** in the workflow editor
2. **Right sidebar shows configuration panel** with "Node Label" field at top
3. **User edits the label** (e.g., "Analyze Ticket" → "Classify Support Request")
4. **Label updates in real-time:**
   - Node visual in canvas shows new label
   - Sidebar header shows new label
   - **Variable references remain stable** (still use node ID like `ai-1`)

## Benefits

### 1. Clear Output Schema
- Developers and users know exactly what fields each node provides
- Autocomplete shows descriptive names for each output
- Reduces trial-and-error when building workflows

### 2. Stable Variable References
- Variables use node IDs (`ai-1`) instead of labels
- Renaming a node doesn't break downstream variable references
- More reliable workflow execution

### 3. Better UX
- Easy to rename nodes for clarity without breaking workflows
- Autocomplete shows relevant outputs based on workflow topology
- Descriptions help users understand what each variable contains

### 4. Maintainable Code
- Centralized output schema in `lib/node-outputs.ts`
- Easy to add new node types or modify existing outputs
- Type-safe with TypeScript

## Example Workflow

### Before:
- Variables used inconsistent syntax: `{{customer_name}}`, `{{analyze_ticket}}`, `{{scheduled_time}}`
- No way to rename nodes without manual template updates
- Unclear what outputs each node provided

### After:
```
Entry Node (entry-1) "New Support Ticket"
  ↓
AI Node (ai-1) "Classify Ticket"
  Outputs: {{ai-1.output}}
  ↓
Condition Node (condition-1) "Is Urgent?"
  Uses: {{ai-1.output}}
  Outputs: {{condition-1.result}}, {{condition-1.leftValue}}, {{condition-1.rightValue}}
  ↓
Slack Node (slack-1) "Alert Team"
  Uses: {{entry-1.customer_name}}, {{ai-1.output}}
  Outputs: {{slack-1.messageId}}, {{slack-1.channel}}
```

Users can rename "Classify Ticket" to "Analyze Support Request" and all `{{ai-1.output}}` references still work!

## Testing Checklist

### Manual Testing:
- [ ] Create a workflow with Entry → AI → Email nodes
- [ ] Rename each node and verify label updates in canvas
- [ ] Type `{{` in AI prompt and verify entry fields appear
- [ ] Type `{{` in Email message and verify AI output appears
- [ ] Rename Entry node and verify variable suggestions still work
- [ ] Save workflow and reload to ensure labels persist
- [ ] Execute workflow to verify variables resolve correctly

### Automated Testing (Future):
- Unit tests for `getNodeOutputs()` with each node type
- Unit tests for `getAvailableVariables()` with various graph topologies
- Integration tests for variable resolution during execution

## Migration Notes

### Existing Workflows:
- Old workflows using label-based variables may need updates
- Template workflows already use correct `{{node-id.field}}` syntax
- Consider adding migration script to convert old variable references

### Future Enhancements:
- Add visual indicator on nodes showing available outputs
- Add "Copy variable" button in output schema UI
- Add variable validation to warn about invalid references
- Add graph visualization showing data flow between nodes

## Files Modified

1. **Created:** `lib/node-outputs.ts` (177 lines)
2. **Modified:** `components/WorkflowBuilderReactFlow.tsx` (+60 lines across multiple sections)
3. **Modified:** `lib/reactflow-types.ts` (+2 lines type fix)

Total: ~240 lines added/modified
