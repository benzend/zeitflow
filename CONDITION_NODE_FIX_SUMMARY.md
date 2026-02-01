# Condition Node Branching Fix - Implementation Summary

## Problem Fixed

**Issue**: When a workflow has a condition node with two downstream branches (e.g., email and SMS), BOTH branches were executing regardless of the condition result.

**Root Cause**: The execution logic in `pages/api/workflow/[id]/execute.ts` had a backward compatibility check (`!conn.sourceHandle`) that allowed connections without sourceHandle to pass through, causing both branches to execute.

## Solution Implemented

### 1. Backend Fix (COMPLETED ✅)

**File**: `pages/api/workflow/[id]/execute.ts` (lines 696-712)

**Changed**:
```typescript
// OLD CODE (buggy):
successorConnections = allSuccessorConnections.filter(conn => {
  // If no sourceHandle specified, follow it (backward compatibility)
  // Otherwise, only follow if sourceHandle matches the condition path
  return !conn.sourceHandle || conn.sourceHandle === selectedPath;
});
```

**To**:
```typescript
// NEW CODE (strict):
successorConnections = allSuccessorConnections.filter(conn => {
  // Condition nodes MUST have explicit sourceHandle
  if (!conn.sourceHandle) {
    const errorMsg = `Condition node "${node.id}" has a connection without sourceHandle. All condition node connections must specify sourceHandle ('true' or 'false').`;
    nodeLogger.error(errorMsg);
    throw new Error(errorMsg);
  }
  return conn.sourceHandle === selectedPath;
});
```

**What This Does**:
- Enforces that all connections from condition nodes MUST have a sourceHandle ('true' or 'false')
- Throws a clear error if a connection is missing sourceHandle
- Only follows the connection that matches the condition result

### 2. Frontend Verification (VERIFIED ✅)

**Condition Node** (`components/reactflow-nodes/ConditionNode.tsx`):
- Has two output handles correctly configured:
  - `id="true"` (line 47) - top-right handle (green)
  - `id="false"` (line 64) - bottom-right handle (red)

**Connection Creation** (`components/WorkflowBuilderReactFlow.tsx`):
- `onConnect` callback (lines 360-367) preserves sourceHandle from connection params
- Spreads `...params` which includes sourceHandle

**Conversion Functions** (`lib/reactflow-types.ts`):
- `convertToReactFlow` (line 61): Preserves `sourceHandle: conn.sourceHandle`
- `convertFromReactFlow` (line 103): Preserves `sourceHandle: edge.sourceHandle || undefined`

**Result**: Frontend correctly creates connections with sourceHandle when connecting from condition node handles.

### 3. Migration Scripts (CREATED ✅)

**Diagnostic Script**: `scripts/check-condition-connections.ts`
- Scans database for condition nodes with connections missing sourceHandle
- Reports affected workflows and connection counts
- Does NOT modify data

**Usage**:
```bash
npx tsx scripts/check-condition-connections.ts
```

**Fix Script**: `scripts/fix-condition-connections.ts`
- Interactive script to fix broken connections
- Prompts user to assign 'true' or 'false' to each broken connection
- Updates database

**Usage**:
```bash
npx tsx scripts/fix-condition-connections.ts
```

## Testing Checklist

### Manual Testing Steps

1. **Create a test workflow**:
   - Add an Entry node with a field (e.g., "test")
   - Add a Condition node:
     - Left value: `{{entry.test}}`
     - Operator: `equals`
     - Right value: `yes`
   - Add an Email node
   - Add an SMS node
   - Connect: Entry → Condition
   - Connect: Condition "true" handle (green) → Email
   - Connect: Condition "false" handle (red) → SMS

2. **Save the workflow**

3. **Execute with condition=true**:
   - Set test field to "yes"
   - Run workflow
   - **Expected**: Only Email node executes
   - **Expected**: SMS node does NOT execute
   - **Expected**: Logs show: "Condition evaluated to true, following 1 of 2 paths"

4. **Execute with condition=false**:
   - Set test field to "no"
   - Run workflow
   - **Expected**: Only SMS node executes
   - **Expected**: Email node does NOT execute
   - **Expected**: Logs show: "Condition evaluated to false, following 1 of 2 paths"

5. **Verify database**:
   ```sql
   SELECT from_node_id, to_node_id, source_handle
   FROM workflow_connections
   WHERE workflow_id = [your test workflow id];
   ```
   - Both connections should have `source_handle` populated with 'true' or 'false'

### Expected Behavior

✅ **Success Criteria**:
- Only ONE branch executes based on condition result
- Execution logs show "following 1 of 2 paths"
- No TypeScript errors
- Clear error message if connections are misconfigured

❌ **Failure Indicators**:
- Both branches execute
- No error thrown for missing sourceHandle
- Logs show "following 2 of 2 paths"

## Troubleshooting

### If Both Branches Still Execute

1. **Check database connections**:
   ```sql
   SELECT * FROM workflow_connections WHERE workflow_id = [id];
   ```
   - Verify sourceHandle is 'true' or 'false', not NULL

2. **Check React Flow editor**:
   - Delete and recreate the connections
   - Make sure you're connecting from the colored handles (T/F labels), not the node body

3. **Run migration script**:
   ```bash
   npx tsx scripts/fix-condition-connections.ts
   ```

### If Error: "Connection without sourceHandle"

This means you have a broken connection. To fix:

1. **Option A - Delete and recreate**:
   - Open workflow in editor
   - Delete the connection from condition node
   - Recreate by dragging from the T (true) or F (false) handle

2. **Option B - Use migration script**:
   ```bash
   npx tsx scripts/fix-condition-connections.ts
   ```

## Files Modified

### Core Fix
- `pages/api/workflow/[id]/execute.ts` - Fixed branching logic

### New Scripts
- `scripts/check-condition-connections.ts` - Diagnostic tool
- `scripts/fix-condition-connections.ts` - Migration tool

### Documentation
- `CONDITION_NODE_FIX_SUMMARY.md` - This file

## Technical Details

### How Condition Nodes Work

1. **Frontend (ConditionNode.tsx)**:
   - Renders two output handles with IDs: 'true' and 'false'
   - User creates connections from these handles

2. **Connection Storage**:
   - React Flow edge has `sourceHandle: 'true' | 'false'`
   - Converted to database: `workflow_connections.source_handle`

3. **Execution (execute.ts)**:
   - Condition node evaluates, returns `{ path: 'true' }` or `{ path: 'false' }`
   - Executor filters connections: `conn.sourceHandle === selectedPath`
   - Only matching connection is followed

### Why The Bug Existed

The original code had this check:
```typescript
return !conn.sourceHandle || conn.sourceHandle === selectedPath;
```

The `!conn.sourceHandle` part was for backward compatibility. But this meant:
- If `sourceHandle` is missing/null → connection is allowed
- Both connections from condition node would pass through
- Both branches would execute

### The Fix

Removed backward compatibility for condition nodes:
```typescript
if (!conn.sourceHandle) {
  throw new Error('Connection without sourceHandle');
}
return conn.sourceHandle === selectedPath;
```

Now:
- Missing sourceHandle → error thrown (fail fast)
- Only connection with matching sourceHandle passes
- Only one branch executes

## Next Steps

1. **Test the fix manually** using the testing checklist above
2. **Check existing workflows** using the diagnostic script
3. **Fix broken workflows** using the migration script (if any found)
4. **Verify in production** that condition nodes now work correctly

## Questions?

If you encounter any issues:
1. Check the execution logs in the workflow execution details page
2. Look for error messages about missing sourceHandle
3. Run the diagnostic script to check for broken connections
4. Use the migration script to fix them
