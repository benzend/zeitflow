AI‑Operated Workflow Engine — Overview


This document explains:


1. How the AI policy process works (step‑by‑step)

2. The required technologies and why they exist

3. How the AI builds and operates workflows at a high level

4. How confidence thresholds prevent disasters

5. How trust escalates over time

6. How this coexists with manual workflow building


---

1. AI Policy Process (Step‑by‑Step)

Scenario


Notify a customer by email when their account is suspended.


Email is an irreversible action, so policy and authority apply.


---

Step 1: Execution Reaches a Decision Point


The system reaches a point where an action is required.

```json
{
  "goal": "Notify customer when account is suspended",
  "state": "ready",
  "facts": [
    "Account is suspended",
    "Customer email exists"
  ]
}
```

---

Step 2: System Builds Planner Context


The AI is given:


- The goal

- Known facts

- Available actions

- Current authority

```json
{
  "availableActions": [
    {
      "id": "email.compose",
      "irreversible": false
    },
    {
      "id": "email.send",
      "irreversible": true
    }
  ],
  "authority": {
    "email.send": false
  }
}
```

---

Step 3: AI Proposes an Action


The AI can only propose an action.

```json
{
  "proposedAction": "email.compose",
  "parameters": {
    "to": "user@example.com",
    "subject": "Account Suspended",
    "body": "Your account has been suspended."
  },
  "confidence": 0.92,
  "reason": "Customer must be notified before further steps"
}
```

---

Step 4: System Evaluates Policy


Policy checks occur before execution.

Example Policy (Simplified)

```rego
allow {
  input.action == "email.send"
  input.authority == true
}
```

Result:


- email.compose → ✅ allowed

- email.send → ❌ blocked (no authority)


---

Step 5: Action Executes or Escalates

- email.compose executes immediately

- Draft is stored

- System logs event

```json
{
  "event": "EMAIL_DRAFT_CREATED"
}
```


---

Step 6: Approval or Authority Grant (Human)


A human reviews the draft and grants single‑use authority


```json
{
  "action": "email.send",
  "maxUses": 1,
  "expiresIn": "1 hour"
}
```



---

Step 7: AI Re‑Evaluates and Proceeds


AI sees updated authority and proposes the next step.

```json
{
  "proposedAction": "email.send",
  "confidence": 0.94
}
```


Policy passes → email is sent.


---

2. Required Technologies


These are the minimum required tools for the system to work correctly.

Execution

- Temporal
	- Durable workflows

	- Long‑running state

	- Human‑in‑the‑loop pauses


Validation

- TypeScript
	- Strong typing across system


- zod
	- Runtime validation for AI output and actions


AI

- Vercel AI SDK
	- Structured LLM calls


- OpenRouter
	- Multi‑model support


Policy

- OPA (Open Policy Agent)
	- Declarative policy enforcement

	- Explainable decisions

	- Developer‑managed (policies authored in Rego by engineers, not business users)


State & Events

- PostgreSQL (Neon)
	- Execution metadata

	- Authority records

	- Append‑only event log


UI

- Next.js + React
	- Human approvals

	- Execution timeline


Visualization (Optional / Derived)

- React Flow
	- Render workflows from events

	- Read‑only representation


Integrations

- Resend / Postmark
	- Email sending (irreversible action)



---

3. How the AI Builds and Operates Workflows (High Level)

Important Clarification


The AI does not build workflows in advance.

Instead, workflows emerge over time from decisions.


---

Step‑By‑Step Flow

Step 1: A Goal Is Created

```json
{
  "goal": "Notify customer when account is suspended"
}
```


---

Step 2: Execution Starts


Temporal begins a new execution for the goal.


```typescript
startExecution(goalId);
```

---

Step 3: AI Chooses the Next Action


AI receives:


- Current state

- Available actions

- Policy constraints

It proposes one action.


---

Step 4: System Executes or Waits

- Safe actions run immediately

- Risky actions pause for approval

Each step is logged as an event.


---

Step 5: Workflow Shape Emerges


From events:

```txt
Account Suspended
  ↓
Compose Email
  ↓
Request Approval
  ↓
Send Email
```



This is rendered visually for humans, but never used for execution.


---

Step 6: System Adapts Over Time


If:


- Approval is repeatedly granted

- No errors occur

The system may ask:


"Can I send the next email automatically?"


Trust grows incrementally.


---

4. Confidence Thresholds


The AI returns a confidence score with each proposed action. This score determines whether the action can proceed or requires human review.

When Confidence Is Below Threshold

If confidence < threshold for an irreversible action:

1. The action is saved as a draft (not executed)

2. Human is notified immediately

3. System explains the source of uncertainty

```json
{
  "proposedAction": "email.send",
  "confidence": 0.67,
  "uncertaintyReason": "Customer has multiple email addresses on file; unsure which is primary",
  "fallbackAction": "email.saveDraft"
}
```

This is how disasters are avoided. The AI gets to show its work without risking irreversible actions when it's uncertain.


---

5. Error Handling


Errors do not halt the entire workflow.

When an Error Occurs

1. User is notified immediately

2. Error is logged to the event stream

3. Workflow continues to the next viable step

```json
{
  "event": "ACTION_FAILED",
  "action": "slack.postMessage",
  "error": "Channel not found",
  "workflowStatus": "continuing"
}
```

Recovery and compensation logic depends on the specific flow. Some errors may trigger alternative paths; others are informational only.


---

6. Trust Escalation


Trust grows incrementally based on successful execution history. The system tracks trust at multiple granularities:

Action‑Level Trust

Track success rate per action type.

"AI has sent 50 emails with 0 errors" → system could auto‑approve `email.send`

```json
{
  "action": "email.send",
  "successCount": 50,
  "errorCount": 0,
  "autoApproveEligible": true
}
```

Goal‑Pattern‑Level Trust

Track success rate for recurring goal patterns.

"AI has handled 20 'account suspended' flows successfully" → could auto‑approve the entire pattern

```json
{
  "goalPattern": "notify_on_account_suspended",
  "successCount": 20,
  "errorCount": 0,
  "autoApproveEligible": true
}
```

Context‑Specific Trust

Trust can vary based on context attributes.

"Auto‑approve for low‑value accounts, require approval for enterprise"

```json
{
  "action": "email.send",
  "contextRules": [
    {
      "condition": "account.tier == 'free'",
      "autoApprove": true
    },
    {
      "condition": "account.tier == 'enterprise'",
      "autoApprove": false
    }
  ]
}
```

Implementation Note

Start with action‑level trust tracking. Add goal‑pattern and context layers as needed based on real usage patterns.


---

7. Coexistence with Manual Workflow Builder


This AI‑driven architecture runs alongside the existing React Flow visual builder. They share the same underlying primitives but serve different entry points.

Manual Mode (Visual Builder)

- Human designs workflow visually using React Flow

- System executes the defined graph as specified

- Predictable, explicit control

- Best for: Well‑understood, repeatable processes

Agent Mode (AI‑Driven)

- Human defines a goal in natural language

- AI proposes steps, policies gate execution

- Workflow emerges from execution history

- Best for: Exploratory, adaptive, or complex multi‑step goals

Shared Primitives

Both modes use the same:

- Node types (entry, ai, email, slack, etc.)

- Action definitions

- Policy checks (OPA)

- Event logging

- Execution tracking

This means a workflow that emerges from agent mode could later be "crystallized" into a reusable visual template, and vice versa.


---

One‑Sentence Summary

The AI proposes actions, policies decide what's allowed, humans grant authority when needed, and workflows emerge from execution history — not from diagrams.
