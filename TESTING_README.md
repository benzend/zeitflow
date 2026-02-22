# Testing Documentation - Variable System Changes

This directory contains comprehensive testing documentation for the recent variable system changes to the ZeitFlow workflow builder.

---

## 📋 Quick Start

**Just want to test?** → Open `MANUAL_TESTING_GUIDE.md`

**Want the summary?** → Open `TESTING_COMPLETE.md`

**Need a checklist?** → Open `TESTING_CHECKLIST.md`

**Want detailed coverage?** → Open `TESTING_IMPLEMENTATION_SUMMARY.md`

---

## 📁 Documentation Files

### 1. **TESTING_COMPLETE.md** ⭐ START HERE
**Purpose:** High-level summary of what was implemented
**Use when:** You want a quick overview of testing status

Contains:
- What was delivered (tests + docs)
- Test results summary
- Key findings
- Next steps
- Success metrics

---

### 2. **MANUAL_TESTING_GUIDE.md** ⭐ TESTING GUIDE
**Purpose:** Step-by-step instructions for manual testing
**Use when:** You're ready to test the application

Contains:
- Phase-by-phase test procedures (7 phases)
- Critical test scenarios
- Database verification queries
- Troubleshooting guide
- Success criteria checklist

**Estimated Time:** 60 minutes for critical tests

---

### 3. **TESTING_CHECKLIST.md** ⭐ QUICK REFERENCE
**Purpose:** Printable checklist for tracking test progress
**Use when:** You're actively testing and need to track status

Contains:
- Critical test items (must pass)
- Important test items (should pass)
- Issue tracking template
- Quick database queries

**Print this and check off items as you test.**

---

### 4. **TESTING_IMPLEMENTATION_SUMMARY.md** 📊 DETAILED REPORT
**Purpose:** Comprehensive report on test coverage
**Use when:** You want to understand what's tested vs. not tested

Contains:
- Detailed test file descriptions
- Coverage analysis (what's tested, what's not)
- Known issues and edge cases
- Comparison to original plan
- Future testing recommendations

---

## 🧪 Automated Tests

### Location
- `__tests__/lib/node-outputs.test.ts` (27 tests)
- `__tests__/lib/workflow-execution.test.ts` (39 tests)

### Running Tests

```bash
# Run all tests
pnpm test

# Run only the new variable system tests
pnpm test node-outputs workflow-execution

# Run with coverage
pnpm test:coverage

# Watch mode (during development)
pnpm test:watch
```

### Test Results
```
✅ 66 new tests created
✅ All tests passing
⏱️  Execution time: <1 second
```

---

## 🎯 What Changed (Recap)

The variable system received four major changes:

1. **Node Renaming UI**
   - Added "Node Label" input to all node config panels
   - Labels persist across saves

2. **Friendly Variable Names**
   - Changed from UUID format: `{{entry-abc123.field}}`
   - To friendly format: `{{new_ticket.field}}`

3. **Nested Output Structure**
   - Changed from flat: `{var1: val1, var2: val2}`
   - To nested: `{node_name: {field1: val1, field2: val2}}`

4. **Condition Node Branch Saving**
   - Fixed bug where false branches weren't persisting
   - Now saves both true and false connections with `sourceHandle`

---

## ✅ What's Tested

### Automated Tests Cover:
- ✅ Variable name transformation (9 tests)
- ✅ Node output schemas (10 tests)
- ✅ Variable availability discovery (8 tests)
- ✅ Variable extraction (9 tests)
- ✅ Variable substitution (23 tests)
- ✅ Condition node branching (3 tests)
- ✅ Edge cases (4 tests)

### Manual Tests Cover:
- UI updates (node labels)
- Autocomplete dropdown
- Database persistence
- Actual workflow execution
- Integration executor variable substitution
- Template workflows

---

## 🚨 Critical Tests (Must Pass)

Before deploying to production, these must pass:

1. **Node Labels Persist** ✋
   - Create node, rename it, save, reload
   - Label must still show new name

2. **Autocomplete Shows Friendly Names** ✋
   - Type `{{` in any prompt field
   - Should see `node_name.field`, NOT UUIDs

3. **Variables Substitute in Execution** ✋
   - Execute workflow with variables
   - Check logs - no "Variable not found" errors

4. **Condition Branches Save** ✋
   - Connect both true and false branches
   - Save and reload
   - Both connections must be visible

5. **Templates Work** ✋
   - Use official template
   - Execute with test data
   - Should complete successfully

---

## 🐛 Known Issues

These edge cases are documented and tested:

1. **Variable Name Collisions**
   - "User-Data" and "User Data" both → `user_data`
   - Second node overwrites first

2. **Empty Labels**
   - Empty label creates invalid variable: `.field`
   - Should validate in UI

3. **Fields with Dots**
   - Field name `user.name` conflicts with path syntax
   - Cannot access with `{{node.user.name}}`

4. **Malformed Variables**
   - `{{{name}}}` (triple braces) partially extracted
   - Should make regex stricter

---

## 📊 Testing Workflow

```
┌─────────────────────────────────────┐
│ 1. Review TESTING_COMPLETE.md      │
│    (Understand what was done)       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 2. Run Automated Tests              │
│    pnpm test node-outputs ...       │
│    ✅ Verify all 66 tests pass      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 3. Open MANUAL_TESTING_GUIDE.md     │
│    Follow Phase 1-7 instructions    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 4. Use TESTING_CHECKLIST.md         │
│    Track progress as you test       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 5. Document Results                 │
│    Fill in checklist                │
│    Screenshot issues                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 6. Decision Point                   │
│    All tests pass? → Deploy         │
│    Issues found? → Fix & retest     │
└─────────────────────────────────────┘
```

---

## 🔍 Troubleshooting

### Automated Tests Failing?
1. Check you're on correct branch
2. Run `pnpm install` to ensure dependencies updated
3. Check Jest version: `pnpm list jest`
4. Clear Jest cache: `pnpm test --clearCache`

### Manual Tests Failing?
1. Check `MANUAL_TESTING_GUIDE.md` troubleshooting section
2. Review browser console for errors
3. Check database queries in guide
4. Verify you're testing correct workflow

### Can't Find Documentation?
All files are in project root:
```
<project-root>/
├── TESTING_README.md (this file)
├── TESTING_COMPLETE.md
├── MANUAL_TESTING_GUIDE.md
├── TESTING_CHECKLIST.md
└── TESTING_IMPLEMENTATION_SUMMARY.md
```

---

## 📈 Success Criteria

Testing is complete when:

- ✅ All 66 automated tests pass
- ✅ All critical manual tests pass (checklist)
- ✅ No regressions in existing functionality
- ✅ Templates execute successfully
- ✅ Database verification queries confirm correct storage
- ✅ No console errors during testing

---

## 🎓 For Developers

### Adding More Tests

```typescript
// Example: Add a new test to node-outputs.test.ts
it('should handle new edge case', () => {
  const node: NodeData = {
    id: 'test-1',
    type: 'entry',
    label: 'Test Label',
    position: { x: 0, y: 0 },
    fields: [{ key: 'field1', label: 'Field 1', type: 'text' }],
  };

  const outputs = getNodeOutputs(node);
  expect(outputs).toHaveLength(1);
  expect(outputs[0].key).toBe('test_label.field1');
});
```

### Test Organization
```
__tests__/
├── lib/
│   ├── node-outputs.test.ts        # Node output schema tests
│   ├── workflow-execution.test.ts  # Execution engine tests
│   ├── workflow-parser.test.ts     # Existing: YAML parser
│   └── workflow-utils.test.ts      # Existing: Utils
└── pages/
    └── api/
        └── workflow.test.ts         # Existing: API tests
```

---

## 📞 Getting Help

**Questions about testing?**
- Review the appropriate doc file above
- Check troubleshooting sections
- Review test code for examples

**Found a bug?**
- Document in TESTING_CHECKLIST.md
- Screenshot the issue
- Note browser console errors
- List steps to reproduce

**Want to add tests?**
- Follow patterns in existing test files
- Keep tests focused and fast
- Document edge cases

---

## 📚 Additional Resources

### Related Files
- `IMPLEMENTATION_SUMMARY.md` - Details of variable system changes
- `lib/node-outputs.ts` - Node output schema implementation
- `pages/api/workflow/[id]/execute.ts` - Execution engine
- `components/WorkflowBuilderReactFlow.tsx` - UI implementation

### Original Plan
- Testing plan was created during plan mode
- See `.claude/projects/.../*.jsonl` for full transcript if needed

---

## 🎉 Summary

**Status:** ✅ Testing implementation complete

**What's Done:**
- 66 automated tests created (all passing)
- Comprehensive manual testing guide
- Quick reference checklist
- Detailed coverage analysis
- Known issues documented

**What's Next:**
- Run manual tests (60 minutes)
- Fix any issues found
- Deploy if all tests pass

---

**Last Updated:** 2026-01-31

**Ready to start testing?** → Open `MANUAL_TESTING_GUIDE.md`
