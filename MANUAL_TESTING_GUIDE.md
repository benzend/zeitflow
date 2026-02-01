# Manual Testing Guide: Variable System Changes

## Quick Start

This guide helps you verify the recent variable system changes work correctly. Complete Phases 1-3 at minimum before deploying.

**Estimated Time:** 30-60 minutes for critical tests

---

## Phase 1: Basic Variable System ⭐ CRITICAL (15 min)

### Test 1.1: Node Renaming
**Goal:** Verify node labels persist across saves

1. Navigate to `/workflows`
2. Create new workflow or open existing
3. Click "Entry" node on canvas
4. In right panel, find "Node Label" input
5. Change from "Entry" to "New Support Ticket"
6. ✅ **Expected:** Label updates on canvas immediately
7. Click "Save Workflow" button
8. Refresh page (CMD+R / F5)
9. ✅ **Expected:** Label persists as "New Support Ticket"

**If this fails, STOP and investigate before proceeding.**

---

### Test 1.2: Friendly Variable Names in Autocomplete
**Goal:** Verify autocomplete shows readable variable names

1. In same workflow, add an "AI" node
2. Connect Entry → AI
3. Click AI node
4. Click in "User Prompt" textarea
5. Type `{{` (two opening braces)
6. ✅ **Expected:** Autocomplete dropdown appears with:
   - `new_support_ticket.field1`
   - `new_support_ticket.field2`
   - etc.
7. ❌ **NOT Expected:** UUID format like `entry-abc-123-def.field1`

**Screenshot the autocomplete if possible for documentation.**

---

### Test 1.3: Variable Substitution in Execution
**Goal:** Verify variables actually work during execution

1. Setup workflow:
   - Entry node (label: "New Ticket") with fields:
     - `customer_name` (text)
     - `issue` (textarea)
   - AI node (label: "Analyze") with prompt:
     ```
     Analyze ticket from {{new_ticket.customer_name}}:
     {{new_ticket.issue}}
     ```
2. Execute workflow with test data:
   - customer_name: "John Doe"
   - issue: "Cannot login to account"
3. Check execution logs (view execution details)
4. ✅ **Expected:**
   - AI node shows expanded prompt with substituted values
   - No warnings about "Variable not found"
   - AI receives readable prompt

**If variables don't substitute, check execution logs for errors.**

---

## Phase 2: Condition Node Branches ⭐ CRITICAL (10 min)

### Test 2.1: Both Branches Save Correctly
**Goal:** Verify condition node false branch persists

1. Create workflow:
   - Entry → AI → Condition
   - Condition true branch → Slack
   - Condition false branch → Email
2. To connect:
   - Drag from Condition's **green** handle (true) to Slack
   - Drag from Condition's **red** handle (false) to Email
3. Click "Save Workflow"
4. Refresh page
5. ✅ **Expected:** BOTH connections visible
6. ❌ **NOT Expected:** False branch disappears

**This was a critical bug - verify carefully!**

---

### Test 2.2: Condition Routing Works
**Goal:** Verify correct path executes based on condition

**Setup Workflow:**
- Entry node with field: `priority` (text)
- AI node with prompt: `{{entry.priority}}`
- Condition node: `{{ai.output}}` contains `urgent`
- True branch → Slack (message: "URGENT ALERT")
- False branch → Email (subject: "Normal ticket")

**Test True Path:**
1. Execute with `priority = "urgent issue"`
2. ✅ **Expected:** Slack executes, Email does NOT
3. Check execution logs confirm Slack called

**Test False Path:**
1. Execute with `priority = "normal request"`
2. ✅ **Expected:** Email executes, Slack does NOT

---

## Phase 3: Edge Cases (20 min)

### Test 3.1: Special Characters in Node Labels

Test these label transformations:

| Node Label | Expected Variable Name | Test |
|------------|----------------------|------|
| "User-Data" | `user_data` | Type `{{user_data.` |
| "Send Email!!!" | `send_email` | Type `{{send_email.` |
| "New Ticket" | `new_ticket` | Type `{{new_ticket.` |

1. Create nodes with above labels
2. Verify autocomplete shows expected variable names
3. ⚠️ **Warning:** "User-Data" and "User Data" both → `user_data` (collision!)

---

### Test 3.2: Missing Variables Don't Crash
**Goal:** Verify graceful handling of missing variables

1. AI node prompt: `Hello {{nonexistent.field}}!`
2. Execute workflow
3. ✅ **Expected:**
   - Prompt becomes `Hello !` (empty)
   - Execution logs show warning (check console)
   - Workflow completes (doesn't crash)

---

### Test 3.3: Multiple Upstream Nodes (Fan-In)
**Goal:** Verify node can access multiple parent outputs

1. Create workflow:
   ```
   Entry → AI1 (label: "Categorize")
         → AI2 (label: "Prioritize")

   AI1 → Email
   AI2 → Email
   ```
2. Email uses: `Category: {{categorize.output}}, Priority: {{prioritize.output}}`
3. Execute workflow
4. ✅ **Expected:** Email receives both outputs correctly

---

## Phase 4: Template Workflows (15 min)

### Test 4.1: Official Templates Use New Format

1. Navigate to `/templates`
2. Find "Customer Support Ticket Router"
3. Click "Use This Template"
4. Create workflow instance
5. Open in editor
6. Click any AI node
7. View prompt
8. ✅ **Expected:** Variables use format `{{node_name.field}}`
9. ❌ **NOT Expected:** UUIDs or old format

---

### Test 4.2: Template Execution

1. Use "Customer Support Ticket Router" template
2. Execute with test data:
   ```json
   {
     "customer_name": "Alice Smith",
     "customer_email": "alice@test.com",
     "issue": "URGENT: Cannot access account",
     "category": "Account Access"
   }
   ```
3. ✅ **Expected:**
   - Condition detects "URGENT"
   - Routes to urgent channel (Slack)
   - Variables substitute correctly in all nodes

---

## Database Verification

### Check Connection Storage

```sql
-- Replace YOUR_WORKFLOW_ID with actual workflow ID
SELECT
  wc.id,
  wc.from_node_id,
  wc.to_node_id,
  wc.source_handle,
  wc.target_handle
FROM workflow_connections wc
WHERE workflow_id = YOUR_WORKFLOW_ID
ORDER BY wc.id;
```

**For condition nodes, verify:**
- Two rows with same `from_node_id`
- Different `source_handle`: one `'true'`, one `'false'`
- Different `to_node_id` for each branch

---

### Check Execution Logs

```sql
SELECT
  id,
  status,
  logs,
  created_at
FROM workflow_executions
WHERE workflow_id = YOUR_WORKFLOW_ID
ORDER BY created_at DESC
LIMIT 1;
```

**Look for in logs JSON:**
- Variable substitution messages
- Node execution order
- Output data captured from each node
- Warnings about missing variables

---

## Success Criteria Checklist

- [ ] Node labels update immediately and persist across saves
- [ ] Autocomplete shows friendly variable names (no UUIDs)
- [ ] Variables substitute correctly during execution
- [ ] Condition node both branches save to database
- [ ] Condition node routes to correct branch based on result
- [ ] Special characters in labels convert correctly
- [ ] Missing variables don't crash execution
- [ ] Multiple upstream nodes work (fan-in)
- [ ] Template workflows use new variable format
- [ ] Template workflows execute successfully

**If all checked, the variable system is working correctly!**

---

## Known Issues / Edge Cases

### 🟡 Variable Name Collisions
- Labels "User-Data" and "User Data" both → `user_data`
- **Impact:** Second node overwrites first in variable scope
- **Mitigation:** Use distinct labels

### 🟡 Fields with Dots in Names
- If field name is `"user.name"`, conflicts with path syntax
- **Impact:** Cannot access with `{{node.user.name}}`
- **Mitigation:** Avoid dots in field names

### 🟡 Empty Node Labels
- Empty label → variable becomes `.field`
- **Impact:** Unclear variable names
- **Mitigation:** Always provide meaningful labels

---

## Troubleshooting

### Autocomplete Doesn't Show Variables
1. Check node is connected (upstream)
2. Check React Flow connections saved
3. Refresh page and try again
4. Check browser console for errors

### Variables Don't Substitute
1. Check execution logs for "Variable not found" warnings
2. Verify variable name matches exactly (case-sensitive)
3. Check node label hasn't changed
4. Verify node executed before current node

### Condition Branch Not Saving
1. Check you dragged from correct handle (green=true, red=false)
2. Verify `source_handle` in database after save
3. Check for JavaScript errors in console
4. Try removing and re-adding connection

---

## Report Issues

If you find bugs:
1. Note which test failed
2. Screenshot the issue
3. Check browser console for errors
4. Check execution logs in database
5. Document steps to reproduce

---

## Next Steps After Testing

Once testing is complete:

1. ✅ Document any bugs found
2. ✅ Update templates if needed (re-run seed script)
3. ✅ Add any new edge cases to automated tests
4. ✅ Update user documentation with variable naming rules
5. ✅ Consider adding variable name collision detection

---

**Testing Complete?** Review the success criteria checklist. If all items pass, the variable system is ready for production use.
