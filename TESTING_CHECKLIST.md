# Variable System Testing - Quick Checklist

**Use this checklist while testing. Print or keep open in a separate window.**

---

## ⭐ CRITICAL TESTS (Must Pass Before Production)

### Basic Functionality
- [ ] Node labels update immediately on canvas
- [ ] Node labels persist after save/reload
- [ ] Autocomplete shows friendly names (`new_ticket.field`, not UUIDs)
- [ ] Variables substitute during execution (check logs)
- [ ] No "Variable not found" errors for valid variables

### Condition Nodes (Critical Bug Fix)
- [ ] Condition node true branch saves to database
- [ ] Condition node false branch saves to database
- [ ] Both branches visible after reload
- [ ] True path executes when condition is true
- [ ] False path executes when condition is false

### Templates
- [ ] Templates use friendly variable format
- [ ] Template workflows execute successfully
- [ ] All nodes in templates have proper labels

---

## 🟡 Important Tests (Should Pass)

### Variable Naming
- [ ] "User Data" → `user_data` in autocomplete
- [ ] "Send-Email" → `send_email` in autocomplete
- [ ] "Analyze!!!" → `analyze` in autocomplete

### Edge Cases
- [ ] Missing variables don't crash workflow
- [ ] Multiple upstream nodes work (fan-in)
- [ ] Nested variables work (`{{node.field.subfield}}`)
- [ ] Empty variable replaced with empty string

### Database Verification
- [ ] Connection `source_handle` saved correctly
- [ ] Connection `target_handle` saved correctly
- [ ] Execution logs contain variable substitution info

---

## 🔵 Nice-to-Have Tests

### Advanced Scenarios
- [ ] Very long node labels work
- [ ] Special characters handled correctly
- [ ] Diamond graph patterns work
- [ ] Reconvergent paths work

---

## 🐛 Known Issues to Document

- [ ] Variable name collisions (document if found)
- [ ] Empty label behavior
- [ ] Fields with dots in names
- [ ] Any autocomplete quirks

---

## Summary

**Critical Tests Passed:** ___ / 11

**Important Tests Passed:** ___ / 11

**Issues Found:** ___ (describe below)

---

### Issues Found:
1.
2.
3.

---

### Screenshots/Evidence:
- [ ] Autocomplete showing friendly names
- [ ] Condition branches saving
- [ ] Execution logs with substitution
- [ ] Any bugs found

---

**Testing Date:** ________________

**Tester:** ________________

**Status:** [ ] PASS [ ] FAIL [ ] NEEDS FIXES

---

## Quick Database Queries

**Check connections:**
```sql
SELECT from_node_id, to_node_id, source_handle, target_handle
FROM workflow_connections
WHERE workflow_id = YOUR_ID;
```

**Check execution logs:**
```sql
SELECT logs FROM workflow_executions
WHERE workflow_id = YOUR_ID
ORDER BY created_at DESC LIMIT 1;
```

---

**After testing, update IMPLEMENTATION_SUMMARY.md with results.**
