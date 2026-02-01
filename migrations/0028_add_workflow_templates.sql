-- Create workflow_templates table
CREATE TABLE IF NOT EXISTS "workflow_templates" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "slug" text NOT NULL UNIQUE,
  "category" text NOT NULL,
  "tags" text,
  "icon" text,
  "visibility" text DEFAULT 'private' NOT NULL,
  "author_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "author_name" text,
  "nodes" text NOT NULL,
  "connections" text NOT NULL,
  "use_count" integer DEFAULT 0 NOT NULL,
  "last_used_at" timestamp,
  "instructions" text,
  "preview_image" text,
  "source_workflow_id" integer REFERENCES "workflows"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp NOT NULL
);--> statement-breakpoint

-- Create indexes for performance
CREATE INDEX "idx_templates_visibility" ON "workflow_templates"("visibility");--> statement-breakpoint
CREATE INDEX "idx_templates_category" ON "workflow_templates"("category");--> statement-breakpoint
CREATE INDEX "idx_templates_author" ON "workflow_templates"("author_id");--> statement-breakpoint
CREATE INDEX "idx_templates_slug" ON "workflow_templates"("slug");--> statement-breakpoint

-- Seed official templates
INSERT INTO "workflow_templates" (
  "name",
  "description",
  "slug",
  "category",
  "tags",
  "icon",
  "visibility",
  "author_name",
  "nodes",
  "connections",
  "instructions",
  "created_at",
  "updated_at"
) VALUES
(
  'Customer Support Ticket Router',
  'Intelligently route incoming support tickets to the right team based on AI analysis of urgency, category, and sentiment.',
  'customer-support-ticket-router',
  'customer-support',
  '["ai", "slack", "support", "routing"]',
  '🎧',
  'official',
  'ZeitFlow Team',
  '[{"id":"entry-1","type":"entry","label":"New Ticket","x":100,"y":200,"entryType":"webhook","fields":[{"id":"f1","key":"customer_name","name":"customer_name","type":"text","label":"Customer Name"},{"id":"f2","key":"issue","name":"issue","type":"textarea","label":"Issue Description"},{"id":"f3","key":"email","name":"email","type":"email","label":"Customer Email"}]},{"id":"ai-1","type":"ai","label":"Analyze Ticket","x":400,"y":200,"aiConfig":{"model":"google/gemini-2.0-flash-001","systemPrompt":"You are a support ticket classifier. Analyze tickets and categorize them.","userPrompt":"Analyze this support ticket and provide:\n1. Urgency (Low/Medium/High/Critical)\n2. Category (Technical/Billing/Sales/General)\n3. Sentiment (Positive/Neutral/Negative)\n4. Suggested team (Engineering/Finance/Sales/Support)\n\nTicket from {{entry-1.customer_name}} ({{entry-1.email}}):\n{{entry-1.issue}}","outputType":"text","outputStructure":"","hasTemplate":false}},{"id":"conditional-1","type":"conditional","label":"Check Urgency","x":700,"y":200,"conditionConfig":{"leftValue":"{{ai-1.output}}","operator":"contains","rightValue":"Critical"}},{"id":"slack-1","type":"slack","label":"Alert Urgent Team","x":1000,"y":100,"slackConfig":{"channel":"#support-urgent","message":"🚨 CRITICAL TICKET\n\nCustomer: {{entry-1.customer_name}}\nEmail: {{entry-1.email}}\n\nAI Analysis:\n{{ai-1.output}}\n\nIssue:\n{{entry-1.issue}}"}},{"id":"slack-2","type":"slack","label":"Route to Team","x":1000,"y":300,"slackConfig":{"channel":"#support-general","message":"📬 New Support Ticket\n\nCustomer: {{entry-1.customer_name}}\nEmail: {{entry-1.email}}\n\nAI Analysis:\n{{ai-1.output}}\n\nIssue:\n{{entry-1.issue}}"}}]',
  '[{"from":"entry-1","to":"ai-1"},{"from":"ai-1","to":"conditional-1"},{"from":"conditional-1","to":"slack-1","sourceHandle":"true"},{"from":"conditional-1","to":"slack-2","sourceHandle":"false"}]',
  '### Setup Instructions

1. **Configure Slack Integration**
   - Connect your Slack workspace
   - Set #support-urgent for critical tickets
   - Set #support-general for normal tickets
   - Or customize channels based on your team structure

2. **Webhook Setup**
   - Use the webhook URL in your support system (Zendesk, Intercom, etc.)
   - Map customer name, email, and issue to the webhook payload

3. **Customize AI Analysis**
   - Adjust the AI prompt to match your support categories
   - Add custom fields like product version, plan type, etc.

### Use Cases

- Route tickets by urgency and category
- Alert on-call engineers for critical issues
- Analyze customer sentiment for quality monitoring
- Automate initial ticket classification

### Example Webhook Payload

```json
{
  "customer_name": "Jane Smith",
  "email": "jane@example.com",
  "issue": "Cannot access my account after password reset"
}
```',
  now(),
  now()
),
(
  'Lead Qualification System',
  'Automatically score and qualify sales leads using AI, then route high-value prospects to your sales team.',
  'lead-qualification-system',
  'sales',
  '["ai", "sales", "crm", "email", "slack"]',
  '💰',
  'official',
  'ZeitFlow Team',
  '[{"id":"entry-1","type":"entry","label":"New Lead","x":100,"y":200,"entryType":"webhook","fields":[{"id":"f1","key":"name","name":"name","type":"text","label":"Full Name"},{"id":"f2","key":"email","name":"email","type":"email","label":"Email"},{"id":"f3","key":"company","name":"company","type":"text","label":"Company"},{"id":"f4","key":"role","name":"role","type":"text","label":"Job Title"},{"id":"f5","key":"company_size","name":"company_size","type":"text","label":"Company Size"},{"id":"f6","key":"message","name":"message","type":"textarea","label":"Message"}]},{"id":"ai-1","type":"ai","label":"Score Lead","x":400,"y":200,"aiConfig":{"model":"google/gemini-2.0-flash-001","systemPrompt":"You are a sales lead qualifier. Score leads from 0-100 and classify as Hot/Warm/Cold.","userPrompt":"Score this lead and provide:\n1. Lead Score (0-100)\n2. Classification (Hot/Warm/Cold)\n3. Key insights\n4. Recommended action\n\nName: {{entry-1.name}}\nCompany: {{entry-1.company}}\nRole: {{entry-1.role}}\nCompany Size: {{entry-1.company_size}}\nMessage: {{entry-1.message}}","outputType":"text","outputStructure":"","hasTemplate":false}},{"id":"conditional-1","type":"conditional","label":"Hot Lead?","x":700,"y":200,"conditionConfig":{"leftValue":"{{ai-1.output}}","operator":"contains","rightValue":"Hot"}},{"id":"slack-1","type":"slack","label":"Alert Sales Team","x":1000,"y":100,"slackConfig":{"channel":"#sales-hot-leads","message":"🔥 HOT LEAD ALERT!\n\n**{{entry-1.name}}**\n{{entry-1.role}} at {{entry-1.company}}\n{{entry-1.email}}\n\nCompany Size: {{entry-1.company_size}}\n\n**AI Analysis:**\n{{ai-1.output}}\n\n**Message:**\n{{entry-1.message}}"}},{"id":"email-1","type":"email","label":"Send to CRM","x":1000,"y":300,"emailConfig":{"to":[],"subject":"New Lead: {{entry-1.name}} from {{entry-1.company}}","message":"Lead Details:\n\nName: {{entry-1.name}}\nEmail: {{entry-1.email}}\nCompany: {{entry-1.company}}\nRole: {{entry-1.role}}\nSize: {{entry-1.company_size}}\n\nAI Qualification:\n{{ai-1.output}}\n\nMessage:\n{{entry-1.message}}"}}]',
  '[{"from":"entry-1","to":"ai-1"},{"from":"ai-1","to":"conditional-1"},{"from":"conditional-1","to":"slack-1","sourceHandle":"true"},{"from":"conditional-1","to":"email-1","sourceHandle":"false"}]',
  '### Setup Instructions

1. **Configure Slack**
   - Create #sales-hot-leads channel for hot prospects
   - Tag your sales team for instant notifications

2. **Email Integration**
   - Add CRM email for automated lead logging
   - Or integrate directly with your CRM via webhook

3. **Customize Scoring Criteria**
   - Adjust AI prompt to match your ICP (Ideal Customer Profile)
   - Add industry-specific scoring factors
   - Include budget indicators if available

4. **Webhook Integration**
   - Connect to your landing pages, forms, or marketing automation
   - Examples: Typeform, HubSpot, Webflow

### Scoring Factors

The AI considers:
- Job title/seniority
- Company size
- Industry fit
- Message quality and intent
- Budget indicators

### Example Usage

Connect to:
- Website contact forms
- Demo request forms
- Content download gates
- Event registrations',
  now(),
  now()
),
(
  'Blog Post Publishing Pipeline',
  'Streamline content creation with AI assistance, team review, and multi-channel distribution.',
  'blog-post-publishing-pipeline',
  'marketing',
  '["ai", "content", "approval", "email", "slack"]',
  '📝',
  'official',
  'ZeitFlow Team',
  '[{"id":"entry-1","type":"entry","label":"Content Brief","x":100,"y":200,"entryType":"form","fields":[{"id":"f1","key":"topic","name":"topic","type":"text","label":"Blog Topic"},{"id":"f2","key":"keywords","name":"keywords","type":"text","label":"Target Keywords"},{"id":"f3","key":"tone","name":"tone","type":"text","label":"Tone (professional/casual/technical)"},{"id":"f4","key":"outline","name":"outline","type":"textarea","label":"Content Outline"}]},{"id":"ai-1","type":"ai","label":"Generate Draft","x":400,"y":200,"aiConfig":{"model":"google/gemini-2.0-flash-001","systemPrompt":"You are an expert content writer. Create engaging, SEO-optimized blog posts.","userPrompt":"Write a blog post based on this brief:\n\nTopic: {{entry-1.topic}}\nKeywords: {{entry-1.keywords}}\nTone: {{entry-1.tone}}\nOutline: {{entry-1.outline}}\n\nCreate a complete blog post with:\n- Compelling headline\n- Introduction with hook\n- Body sections with subheadings\n- Conclusion with CTA\n- Meta description","outputType":"text","outputStructure":"","hasTemplate":false}},{"id":"review-1","type":"review","label":"Editorial Review","x":700,"y":200,"reviewConfig":{"validationSteps":[],"meetingConfirmed":false}},{"id":"conditional-1","type":"conditional","label":"Approved?","x":1000,"y":200,"conditionConfig":{"leftValue":"{{review-1.decision}}","operator":"equals","rightValue":"approved"}},{"id":"slack-1","type":"slack","label":"Publish Notification","x":1300,"y":100,"slackConfig":{"channel":"#marketing","message":"✅ New blog post published!\n\n**{{entry-1.topic}}**\n\nKeywords: {{entry-1.keywords}}\n\nReviewer notes: {{review-1.comments}}"}},{"id":"email-1","type":"email","label":"Revision Request","x":1300,"y":300,"emailConfig":{"to":[],"subject":"Blog Post Needs Revision: {{entry-1.topic}}","message":"The blog post requires revisions.\n\nTopic: {{entry-1.topic}}\n\nEditor feedback:\n{{review-1.comments}}\n\nOriginal draft:\n{{ai-1.output}}"}}]',
  '[{"from":"entry-1","to":"ai-1"},{"from":"ai-1","to":"review-1"},{"from":"review-1","to":"conditional-1"},{"from":"conditional-1","to":"slack-1","sourceHandle":"true"},{"from":"conditional-1","to":"email-1","sourceHandle":"false"}]',
  '### Setup Instructions

1. **Configure Review Process**
   - Assign editor for review step
   - Set approval criteria and brand guidelines

2. **Slack Integration**
   - Connect #marketing channel for publish notifications
   - Notify content team of new posts

3. **Email Setup**
   - Add content writer email for revision requests
   - Include CMS team for final publishing

4. **Customize AI Writer**
   - Add brand voice guidelines to system prompt
   - Include SEO best practices
   - Add content length preferences

### Workflow Steps

1. Submit content brief with topic and outline
2. AI generates complete first draft
3. Editor reviews and approves/requests revisions
4. Approved posts notify team via Slack
5. Revisions sent back to writer via email

### Best Practices

- Provide detailed outlines for better AI output
- Include target audience in brief
- Review for factual accuracy
- Add internal links in revision phase
- Include images/media references',
  now(),
  now()
),
(
  'Daily Report Generator',
  'Automatically compile and send daily digest emails with AI-generated summaries of key metrics and insights.',
  'daily-report-generator',
  'data-processing',
  '["ai", "email", "analytics", "reporting"]',
  '📊',
  'official',
  'ZeitFlow Team',
  '[{"id":"entry-1","type":"entry","label":"Data Input","x":100,"y":200,"entryType":"webhook","fields":[{"id":"f1","key":"date","name":"date","type":"text","label":"Report Date"},{"id":"f2","key":"revenue","name":"revenue","type":"text","label":"Revenue"},{"id":"f3","key":"signups","name":"signups","type":"text","label":"New Signups"},{"id":"f4","key":"active_users","name":"active_users","type":"text","label":"Active Users"},{"id":"f5","key":"support_tickets","name":"support_tickets","type":"text","label":"Support Tickets"},{"id":"f6","key":"raw_data","name":"raw_data","type":"textarea","label":"Additional Metrics (JSON)"}]},{"id":"ai-1","type":"ai","label":"Generate Summary","x":400,"y":200,"aiConfig":{"model":"google/gemini-2.0-flash-001","systemPrompt":"You are a business analyst. Create insightful daily reports highlighting trends and actionable insights.","userPrompt":"Create a concise daily business summary for {{entry-1.date}}:\n\nKey Metrics:\n- Revenue: {{entry-1.revenue}}\n- New Signups: {{entry-1.signups}}\n- Active Users: {{entry-1.active_users}}\n- Support Tickets: {{entry-1.support_tickets}}\n\nAdditional Data:\n{{entry-1.raw_data}}\n\nProvide:\n1. Executive summary\n2. Key highlights (wins)\n3. Areas of concern\n4. Day-over-day trends\n5. Recommended actions","outputType":"text","outputStructure":"","hasTemplate":false}},{"id":"email-1","type":"email","label":"Send Report","x":700,"y":200,"emailConfig":{"to":[],"subject":"Daily Business Report - {{entry-1.date}}","message":"# Daily Business Report\n**{{entry-1.date}}**\n\n{{ai-1.output}}\n\n---\n\n## Raw Metrics\n- Revenue: {{entry-1.revenue}}\n- New Signups: {{entry-1.signups}}\n- Active Users: {{entry-1.active_users}}\n- Support Tickets: {{entry-1.support_tickets}}\n\nGenerated by ZeitFlow"}}]',
  '[{"from":"entry-1","to":"ai-1"},{"from":"ai-1","to":"email-1"}]',
  '### Setup Instructions

1. **Data Source Integration**
   - Connect your analytics platform (Google Analytics, Mixpanel, etc.)
   - Set up daily webhook trigger at desired time (e.g., 8 AM)
   - Map metrics to webhook payload

2. **Email Recipients**
   - Add leadership team emails
   - Include relevant stakeholders
   - Consider separate reports for different teams

3. **Customize Metrics**
   - Add KPIs specific to your business
   - Include industry benchmarks
   - Add goal tracking

4. **Schedule Automation**
   - Use cron job or scheduler to trigger daily
   - Consider weekend/holiday handling
   - Set timezone preferences

### Integration Examples

**From Google Analytics:**
```javascript
// Daily scheduled function
{
  "date": "2024-01-15",
  "revenue": "$12,450",
  "signups": "47",
  "active_users": "1,234",
  "support_tickets": "12",
  "raw_data": {
    "bounce_rate": "42%",
    "avg_session": "3m 45s"
  }
}
```

**From Database Query:**
```sql
SELECT
  CURRENT_DATE as date,
  SUM(revenue) as revenue,
  COUNT(new_users) as signups,
  COUNT(DISTINCT active_users) as active_users
FROM metrics
WHERE date = CURRENT_DATE
```',
  now(),
  now()
),
(
  'Employee Onboarding Workflow',
  'Automate new hire onboarding with scheduled tasks, welcome emails, and team introductions.',
  'employee-onboarding-workflow',
  'general',
  '["hr", "onboarding", "email", "slack", "scheduling"]',
  '👋',
  'official',
  'ZeitFlow Team',
  '[{"id":"entry-1","type":"entry","label":"New Employee Info","x":100,"y":200,"entryType":"form","fields":[{"id":"f1","key":"name","name":"name","type":"text","label":"Employee Name"},{"id":"f2","key":"email","name":"email","type":"email","label":"Work Email"},{"id":"f3","key":"role","name":"role","type":"text","label":"Job Title"},{"id":"f4","key":"department","name":"department","type":"text","label":"Department"},{"id":"f5","key":"manager","name":"manager","type":"text","label":"Manager Name"},{"id":"f6","key":"start_date","name":"start_date","type":"text","label":"Start Date"}]},{"id":"email-1","type":"email","label":"Welcome Email","x":400,"y":100,"emailConfig":{"to":[],"subject":"Welcome to the Team, {{entry-1.name}}!","message":"Hi {{entry-1.name}},\n\nWelcome to the team! We are excited to have you join us as {{entry-1.role}} in the {{entry-1.department}} department.\n\n**Your Start Date:** {{entry-1.start_date}}\n**Your Manager:** {{entry-1.manager}}\n\n**What to Expect on Day 1:**\n- Team introduction meeting\n- Equipment setup\n- Access to company systems\n- Overview of your role and projects\n\nIf you have any questions before your start date, please don''t hesitate to reach out.\n\nLooking forward to working with you!\n\nBest regards,\nThe Team"}},{"id":"slack-1","type":"slack","label":"Team Introduction","x":400,"y":300,"slackConfig":{"channel":"#general","message":"👋 Please welcome {{entry-1.name}} to the team!\n\n**Role:** {{entry-1.role}}\n**Department:** {{entry-1.department}}\n**Start Date:** {{entry-1.start_date}}\n\nLet''s make sure they feel at home! 🎉"}},{"id":"scheduler-1","type":"scheduler","label":"Schedule Onboarding Meeting","x":700,"y":200,"schedulerConfig":{"people":[],"minTimeRequirement":"60","calendar":"primary"}}]',
  '[{"from":"entry-1","to":"email-1"},{"from":"entry-1","to":"slack-1"},{"from":"entry-1","to":"scheduler-1"}]',
  '### Setup Instructions

1. **Email Configuration**
   - Update welcome email template with company branding
   - Add HR contact information
   - Include links to employee handbook, benefits info

2. **Slack Integration**
   - Set announcement channel (#general or #team)
   - Consider department-specific channels
   - Add fun welcome GIFs or company culture elements

3. **Calendar Setup**
   - Configure onboarding meeting duration
   - Add manager and relevant team members
   - Include meeting agenda in description

4. **Customize Workflow**
   - Add IT ticket creation for equipment
   - Include access provisioning steps
   - Add follow-up emails for week 2, month 1

### Onboarding Checklist

Create additional workflows for:
- Day 1: Equipment setup, system access
- Week 1: Team meetings, training sessions
- Month 1: Check-in meeting, goal setting
- Month 3: Performance review, feedback session

### Integration Ideas

- Connect to HRIS (BambooHR, Workday)
- Trigger from offer acceptance
- Create Jira/Asana onboarding tasks
- Provision accounts (Google, Slack, GitHub)',
  now(),
  now()
),
(
  'Invoice Approval Process',
  'Streamline invoice approvals with automated routing, manager review, and accounting notifications.',
  'invoice-approval-process',
  'approval',
  '["finance", "approval", "email", "review"]',
  '💳',
  'official',
  'ZeitFlow Team',
  '[{"id":"entry-1","type":"entry","label":"Invoice Submission","x":100,"y":200,"entryType":"form","fields":[{"id":"f1","key":"vendor","name":"vendor","type":"text","label":"Vendor Name"},{"id":"f2","key":"amount","name":"amount","type":"text","label":"Invoice Amount"},{"id":"f3","key":"invoice_number","name":"invoice_number","type":"text","label":"Invoice Number"},{"id":"f4","key":"category","name":"category","type":"text","label":"Expense Category"},{"id":"f5","key":"description","name":"description","type":"textarea","label":"Description"},{"id":"f6","key":"submitted_by","name":"submitted_by","type":"text","label":"Submitted By"}]},{"id":"conditional-1","type":"conditional","label":"Requires Approval?","x":400,"y":200,"conditionConfig":{"leftValue":"{{entry-1.amount}}","operator":"greater_than","rightValue":"1000"}},{"id":"review-1","type":"review","label":"Manager Approval","x":700,"y":100,"reviewConfig":{"validationSteps":[],"meetingConfirmed":false}},{"id":"email-1","type":"email","label":"Approved - Send to Accounting","x":1000,"y":50,"emailConfig":{"to":[],"subject":"Invoice Approved: {{entry-1.vendor}} - {{entry-1.invoice_number}}","message":"An invoice has been approved for payment.\n\n**Vendor:** {{entry-1.vendor}}\n**Amount:** {{entry-1.amount}}\n**Invoice #:** {{entry-1.invoice_number}}\n**Category:** {{entry-1.category}}\n**Submitted by:** {{entry-1.submitted_by}}\n\n**Description:**\n{{entry-1.description}}\n\n**Approver Notes:**\n{{review-1.comments}}\n\nPlease process for payment."}},{"id":"email-2","type":"email","label":"Rejected - Notify Submitter","x":1000,"y":200,"emailConfig":{"to":[],"subject":"Invoice Rejected: {{entry-1.vendor}} - {{entry-1.invoice_number}}","message":"Your invoice submission has been rejected.\n\n**Vendor:** {{entry-1.vendor}}\n**Amount:** {{entry-1.amount}}\n**Invoice #:** {{entry-1.invoice_number}}\n\n**Reason:**\n{{review-1.comments}}\n\nPlease address the concerns and resubmit if appropriate."}},{"id":"email-3","type":"email","label":"Auto-Approved - Send to Accounting","x":700,"y":300,"emailConfig":{"to":[],"subject":"Invoice Auto-Approved: {{entry-1.vendor}} - {{entry-1.invoice_number}}","message":"An invoice under $1,000 has been auto-approved.\n\n**Vendor:** {{entry-1.vendor}}\n**Amount:** {{entry-1.amount}}\n**Invoice #:** {{entry-1.invoice_number}}\n**Category:** {{entry-1.category}}\n**Submitted by:** {{entry-1.submitted_by}}\n\n**Description:**\n{{entry-1.description}}\n\nPlease process for payment."}}]',
  '[{"from":"entry-1","to":"conditional-1"},{"from":"conditional-1","to":"review-1","sourceHandle":"true"},{"from":"conditional-1","to":"email-3","sourceHandle":"false"},{"from":"review-1","to":"email-1"},{"from":"review-1","to":"email-2"}]',
  '### Setup Instructions

1. **Set Approval Thresholds**
   - Current: $1,000 requires manager approval
   - Adjust amount in conditional node
   - Consider multiple approval tiers

2. **Email Configuration**
   - Add accounting team email
   - Include finance manager for high amounts
   - Set up submitter notification

3. **Review Process**
   - Assign appropriate approvers
   - Set SLA expectations
   - Add escalation for overdue approvals

4. **Customize Categories**
   - Add expense category validation
   - Map categories to GL codes
   - Include budget tracking

### Approval Matrix Example

- Under $1,000: Auto-approved
- $1,000 - $5,000: Manager approval
- $5,000 - $25,000: Director approval
- Over $25,000: VP approval

Implement multiple conditional nodes for tiered approvals.

### Integration Options

- Connect to accounting software (QuickBooks, Xero)
- Attach invoice PDFs via file upload field
- Integrate with expense management (Expensify)
- Link to purchase order system',
  now(),
  now()
),
(
  'Emergency Alert System',
  'Broadcast critical alerts across multiple channels with priority routing and escalation.',
  'emergency-alert-system',
  'communication',
  '["emergency", "sms", "email", "slack", "alerts"]',
  '🚨',
  'official',
  'ZeitFlow Team',
  '[{"id":"entry-1","type":"entry","label":"Alert Trigger","x":100,"y":200,"entryType":"webhook","fields":[{"id":"f1","key":"severity","name":"severity","type":"text","label":"Severity (P1/P2/P3/P4)"},{"id":"f2","key":"title","name":"title","type":"text","label":"Alert Title"},{"id":"f3","key":"description","name":"description","type":"textarea","label":"Incident Description"},{"id":"f4","key":"affected_systems","name":"affected_systems","type":"text","label":"Affected Systems"},{"id":"f5","key":"incident_commander","name":"incident_commander","type":"text","label":"Incident Commander"}]},{"id":"conditional-1","type":"conditional","label":"Critical Alert?","x":400,"y":200,"conditionConfig":{"leftValue":"{{entry-1.severity}}","operator":"equals","rightValue":"P1"}},{"id":"sms-1","type":"sms","label":"SMS On-Call Team","x":700,"y":50,"smsConfig":{"to":[],"message":"🚨 P1 ALERT: {{entry-1.title}}\n\nAffected: {{entry-1.affected_systems}}\nIC: {{entry-1.incident_commander}}\n\nRespond immediately."}},{"id":"slack-1","type":"slack","label":"Post to #incidents","x":700,"y":150,"slackConfig":{"channel":"#incidents","message":"🚨 **{{entry-1.severity}} ALERT**\n\n**{{entry-1.title}}**\n\n**Affected Systems:** {{entry-1.affected_systems}}\n**Incident Commander:** {{entry-1.incident_commander}}\n\n**Description:**\n{{entry-1.description}}\n\n@channel - Please acknowledge"}},{"id":"email-1","type":"email","label":"Email Leadership","x":700,"y":250,"emailConfig":{"to":[],"subject":"[{{entry-1.severity}}] ALERT: {{entry-1.title}}","message":"Severity: {{entry-1.severity}}\n\nIncident: {{entry-1.title}}\n\nAffected Systems: {{entry-1.affected_systems}}\n\nIncident Commander: {{entry-1.incident_commander}}\n\nDescription:\n{{entry-1.description}}\n\nA response team has been notified and is investigating."}},{"id":"slack-2","type":"slack","label":"Standard Notification","x":700,"y":400,"slackConfig":{"channel":"#incidents","message":"⚠️ **{{entry-1.severity}} Alert**\n\n**{{entry-1.title}}**\n\n**Affected Systems:** {{entry-1.affected_systems}}\n**Incident Commander:** {{entry-1.incident_commander}}\n\n**Description:**\n{{entry-1.description}}"}}]',
  '[{"from":"entry-1","to":"conditional-1"},{"from":"conditional-1","to":"sms-1","sourceHandle":"true"},{"from":"conditional-1","to":"slack-1","sourceHandle":"true"},{"from":"conditional-1","to":"email-1","sourceHandle":"true"},{"from":"conditional-1","to":"slack-2","sourceHandle":"false"}]',
  '### Setup Instructions

1. **SMS Configuration**
   - Add on-call team phone numbers
   - Set up Twilio account
   - Consider PagerDuty integration

2. **Slack Channels**
   - Create #incidents for all alerts
   - Set up #critical for P1/P2 only
   - Configure @channel permissions

3. **Email Distribution**
   - Add leadership team
   - Include relevant stakeholders
   - Set up distribution lists by severity

4. **Severity Levels**
   - P1: Critical - Service down, revenue impact
   - P2: High - Major functionality impaired
   - P3: Medium - Minor issues, workaround exists
   - P4: Low - Cosmetic, no impact

### Integration Examples

**From Monitoring Tools:**
```javascript
// Datadog, New Relic, PagerDuty webhook
{
  "severity": "P1",
  "title": "API Response Time Degraded",
  "description": "95th percentile response time > 5s",
  "affected_systems": "API Gateway, Database",
  "incident_commander": "John Doe"
}
```

**From Manual Trigger:**
- Create Slack slash command
- Set up web form for incident declaration
- Integrate with incident management tool

### Escalation Flow

1. P1 → SMS + Slack + Email (immediate)
2. P2 → Slack + Email (within 5 min)
3. P3 → Slack (within 15 min)
4. P4 → Email digest (daily)

Add time-based escalation nodes for unacknowledged alerts.',
  now(),
  now()
),
(
  'Content Feedback Analyzer',
  'Collect and analyze customer feedback using AI to identify trends, sentiment, and actionable insights.',
  'content-feedback-analyzer',
  'customer-support',
  '["ai", "feedback", "analysis", "email"]',
  '💭',
  'official',
  'ZeitFlow Team',
  '[{"id":"entry-1","type":"entry","label":"Feedback Submission","x":100,"y":200,"entryType":"form","fields":[{"id":"f1","key":"customer_name","name":"customer_name","type":"text","label":"Customer Name"},{"id":"f2","key":"email","name":"email","type":"email","label":"Email"},{"id":"f3","key":"product","name":"product","type":"text","label":"Product/Feature"},{"id":"f4","key":"rating","name":"rating","type":"text","label":"Rating (1-5)"},{"id":"f5","key":"feedback","name":"feedback","type":"textarea","label":"Feedback"}]},{"id":"ai-1","type":"ai","label":"Analyze Feedback","x":400,"y":200,"aiConfig":{"model":"google/gemini-2.0-flash-001","systemPrompt":"You are a product analyst specializing in customer feedback analysis.","userPrompt":"Analyze this customer feedback:\n\nCustomer: {{entry-1.customer_name}}\nProduct: {{entry-1.product}}\nRating: {{entry-1.rating}}/5\n\nFeedback:\n{{entry-1.feedback}}\n\nProvide:\n1. Sentiment (Positive/Neutral/Negative)\n2. Key themes (max 3)\n3. Priority (High/Medium/Low)\n4. Suggested category (Bug/Feature Request/Improvement/Praise)\n5. Actionable insights for product team","outputType":"text","outputStructure":"","hasTemplate":false}},{"id":"conditional-1","type":"conditional","label":"Urgent Issue?","x":700,"y":200,"conditionConfig":{"leftValue":"{{ai-1.output}}","operator":"contains","rightValue":"Priority: High"}},{"id":"slack-1","type":"slack","label":"Alert Product Team","x":1000,"y":100,"slackConfig":{"channel":"#product-feedback","message":"⚠️ **High Priority Feedback**\n\nCustomer: {{entry-1.customer_name}} ({{entry-1.email}})\nProduct: {{entry-1.product}}\nRating: {{entry-1.rating}}/5\n\n**AI Analysis:**\n{{ai-1.output}}\n\n**Original Feedback:**\n{{entry-1.feedback}}"}},{"id":"email-1","type":"email","label":"Weekly Digest","x":1000,"y":300,"emailConfig":{"to":[],"subject":"Customer Feedback: {{entry-1.product}}","message":"New feedback received:\n\nCustomer: {{entry-1.customer_name}}\nRating: {{entry-1.rating}}/5\nProduct: {{entry-1.product}}\n\nAI Analysis:\n{{ai-1.output}}\n\nFeedback:\n{{entry-1.feedback}}"}}]',
  '[{"from":"entry-1","to":"ai-1"},{"from":"ai-1","to":"conditional-1"},{"from":"conditional-1","to":"slack-1","sourceHandle":"true"},{"from":"conditional-1","to":"email-1","sourceHandle":"false"}]',
  '### Setup Instructions

1. **Feedback Collection**
   - Embed form on website/app
   - Send via email after purchase
   - Trigger after support interactions
   - Include in product (in-app feedback)

2. **Slack Integration**
   - Set #product-feedback for urgent items
   - Create #feedback-log for all submissions
   - Tag relevant team members

3. **Email Digest**
   - Configure product team emails
   - Set up weekly summary reports
   - Include trend analysis

4. **AI Customization**
   - Add product-specific categories
   - Train on common themes
   - Include competitive analysis

### Analysis Categories

The AI identifies:
- **Bugs:** Technical issues, errors
- **Feature Requests:** New functionality
- **Improvements:** Enhancements to existing features
- **Praise:** Positive feedback
- **UX Issues:** Usability problems

### Integration Options

- Connect to customer support tools
- Link to product roadmap (Productboard, Aha!)
- Export to analytics dashboard
- Sync with CRM for customer context

### Response Automation

Add follow-up workflows:
- Thank you email for all feedback
- Status updates on feature requests
- Resolution notifications for bugs
- Survey for additional details',
  now(),
  now()
),
(
  'Simple Webhook to Email',
  'The simplest workflow - receive webhook data and forward it via email. Perfect for notifications and alerts.',
  'simple-webhook-to-email',
  'communication',
  '["email", "webhook", "notification"]',
  '📬',
  'official',
  'ZeitFlow Team',
  '[{"id":"entry-1","type":"entry","label":"Webhook Trigger","x":100,"y":200,"entryType":"webhook","fields":[{"id":"f1","key":"subject","name":"subject","type":"text","label":"Email Subject"},{"id":"f2","key":"message","name":"message","type":"textarea","label":"Message Body"}]},{"id":"email-1","type":"email","label":"Send Email","x":400,"y":200,"emailConfig":{"to":[],"subject":"{{entry-1.subject}}","message":"{{entry-1.message}}"}}]',
  '[{"from":"entry-1","to":"email-1"}]',
  '### Setup Instructions

1. **Configure Email Recipients**
   - Add recipient email addresses in the Email node
   - Use multiple addresses for distribution lists

2. **Webhook Integration**
   - Copy the workflow webhook URL
   - Configure your service to POST to this URL
   - Map your data to subject and message fields

3. **Test the Workflow**
   - Send a test webhook payload
   - Verify email delivery
   - Check spam folder if needed

### Example Webhook Payload

```bash
curl -X POST https://yourapp.com/api/workflows/webhook/YOUR_ID \\
  -H "Content-Type: application/json" \\
  -d ''{
    "subject": "Server Alert",
    "message": "CPU usage exceeded 90%"
  }''
```

### Use Cases

- Server monitoring alerts
- Form submissions
- Payment notifications
- System event notifications
- Third-party integrations
- Custom alerting systems

### Advanced Usage

Extend this template by adding:
- Conditional routing based on content
- SMS notifications for critical alerts
- Slack messages for team notifications
- Data formatting with AI nodes',
  now(),
  now()
),
(
  'AI-Powered FAQ Responder',
  'Automatically respond to common questions using AI to generate helpful, context-aware answers.',
  'ai-powered-faq-responder',
  'customer-support',
  '["ai", "email", "support", "automation"]',
  '🤖',
  'official',
  'ZeitFlow Team',
  '[{"id":"entry-1","type":"entry","label":"Question Received","x":100,"y":200,"entryType":"webhook","fields":[{"id":"f1","key":"customer_email","name":"customer_email","type":"email","label":"Customer Email"},{"id":"f2","key":"customer_name","name":"customer_name","type":"text","label":"Customer Name"},{"id":"f3","key":"question","name":"question","type":"textarea","label":"Question"}]},{"id":"ai-1","type":"ai","label":"Generate Answer","x":400,"y":200,"aiConfig":{"model":"google/gemini-2.0-flash-001","systemPrompt":"You are a helpful customer support agent. Answer questions clearly and professionally. If you don''t know the answer, direct the customer to contact support.","userPrompt":"Customer Question: {{entry-1.question}}\n\nProvide a helpful, accurate answer. Include:\n- Direct answer to their question\n- Any relevant additional information\n- Next steps or related resources\n\nKeep it concise and friendly.","outputType":"text","outputStructure":"","hasTemplate":false}},{"id":"email-1","type":"email","label":"Send Response","x":700,"y":200,"emailConfig":{"to":[],"subject":"Re: Your Question","message":"Hi {{entry-1.customer_name}},\n\nThank you for reaching out! Here''s the answer to your question:\n\n**Your Question:**\n{{entry-1.question}}\n\n**Answer:**\n{{ai-1.output}}\n\nIf you have any other questions or need further assistance, please don''t hesitate to ask.\n\nBest regards,\nSupport Team"}}]',
  '[{"from":"entry-1","to":"ai-1"},{"from":"ai-1","to":"email-1"}]',
  '### Setup Instructions

1. **Configure AI Knowledge Base**
   - Update system prompt with your product info
   - Add common FAQs and answers
   - Include links to documentation
   - Set boundaries for what AI should/shouldn''t answer

2. **Email Setup**
   - Set customer_email as recipient
   - Customize email signature
   - Add support contact info

3. **Webhook Integration**
   - Connect to contact form
   - Integrate with chat widget
   - Link to email forwarding

4. **Quality Control**
   - Add review step for complex questions
   - Monitor AI responses regularly
   - Update prompts based on feedback

### Best Practices

**AI Prompt Enhancement:**
- Include product documentation in system prompt
- Add pricing information
- Include technical specifications
- Reference company policies
- Add troubleshooting guides

**When to Use:**
- After-hours support
- High-volume simple questions
- Initial response while routing
- Tier 1 support automation

**When NOT to Use:**
- Billing/refund requests
- Security issues
- Complex technical problems
- Legal questions

### Advanced Enhancements

Add these nodes for better functionality:
- Conditional routing for human escalation
- Slack notification for complex queries
- Sentiment analysis for upset customers
- Feedback collection on AI responses',
  now(),
  now()
);
