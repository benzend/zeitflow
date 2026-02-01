# Quick Test Guide - Condition Node Fix

## 30-Second Test

### Setup
1. Open your workflow builder
2. Create this simple workflow:
   ```
   Entry → Condition → Email (true path)
                   └→ SMS (false path)
   ```

### Configuration

**Entry Node**:
- Add field: `answer` (type: text)

**Condition Node**:
- Left: `{{entry.answer}}`
- Operator: `equals`
- Right: `yes`

**Email Node**:
- To: `test@example.com`
- Subject: `TRUE PATH`
- Body: `Condition was true!`

**SMS Node**:
- To: `+1234567890`
- Message: `FALSE PATH - Condition was false!`

### Connections
- Entry → Condition (any handle)
- Condition **T** (green top handle) → Email
- Condition **F** (red bottom handle) → SMS

**IMPORTANT**: Make sure to connect from the colored T/F handles, not just the node edge!

### Test 1: True Path
1. Execute workflow with `answer = "yes"`
2. **Expected**:
   - ✅ Email node executes
   - ❌ SMS node does NOT execute
   - Logs show: "Condition evaluated to true, following 1 of 2 paths"

### Test 2: False Path
1. Execute workflow with `answer = "no"`
2. **Expected**:
   - ❌ Email node does NOT execute
   - ✅ SMS node executes
   - Logs show: "Condition evaluated to false, following 1 of 2 paths"

## Success ✅
If only ONE node executes per test, the fix is working!

## Failure ❌
If BOTH nodes execute:
1. Check database:
   ```sql
   SELECT from_node_id, to_node_id, source_handle
   FROM workflow_connections
   WHERE workflow_id = [your workflow id];
   ```
2. If `source_handle` is NULL, run:
   ```bash
   npx tsx scripts/fix-condition-connections.ts
   ```
3. Alternatively, delete and recreate connections from the T/F handles

## Common Issues

### "Both branches still executing"
- **Cause**: Connections missing sourceHandle
- **Fix**: Delete connections and recreate from the T/F colored handles

### Error: "Connection without sourceHandle"
- **Cause**: Old workflow with missing sourceHandle
- **Fix**: Run migration script or recreate connections

### Can't find the T/F handles
- **Look for**: Small colored circles on the right side of condition node
  - Green circle with "T" = true path
  - Red circle with "F" = false path

## Visual Reference

```
┌─────────────┐
│   Entry     │
│  [answer]   │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Condition   │  T (green) ─→ Email (true path)
│ answer=yes? │
└─────────────┘  F (red)   ─→ SMS (false path)
```

Make sure your connections look like this!
