AI‑Operated Workflow Engine — Overview


This document explains:


1. How the AI policy process works (step‑by‑step)

2. The required technologies and why they exist

3. How the AI builds and operates workflows at a high level


---

1. AI Policy Process (Step‑by‑Step)

Scenario


Notify a customer by email when their account is suspended.


Email is an irreversible action, so policy and authority apply.


---

Step 1: Execution Reaches a Decision Point


The system reaches a point where an action is required.

```json
```
{
  "goal": "Notify customer when account is suspended",
  "state": "ready",
  "facts": [
    "Account is suspended",
    "Customer email exists"
  ]
}
```
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


---
```

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

```
```

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


“Can I send the next email automatically?”


Trust grows incrementally.


---

One‑Sentence Summary

The AI proposes actions, policies decide what’s allowed, humans grant authority when needed, and workflows emerge from execution history — not from diagrams.
