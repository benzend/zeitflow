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

2. **Webhook Setup**
   - Use the webhook URL in your support system
   - Map customer name, email, and issue fields

3. **Customize AI Analysis**
   - Adjust the prompt to match your categories
   - Add custom fields like product version',
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
  '[{"id":"entry-1","type":"entry","label":"New Lead","x":100,"y":200,"entryType":"webhook","fields":[{"id":"f1","key":"name","name":"name","type":"text","label":"Full Name"},{"id":"f2","key":"email","name":"email","type":"email","label":"Email"},{"id":"f3","key":"company","name":"company","type":"text","label":"Company"},{"id":"f4","key":"role","name":"role","type":"text","label":"Job Title"},{"id":"f5","key":"company_size","name":"company_size","type":"text","label":"Company Size"},{"id":"f6","key":"message","name":"message","type":"textarea","label":"Message"}]},{"id":"ai-1","type":"ai","label":"Score Lead","x":400,"y":200,"aiConfig":{"model":"google/gemini-2.0-flash-001","systemPrompt":"You are a sales lead qualifier. Score leads from 0-100 and classify as Hot/Warm/Cold.","userPrompt":"Score this lead:\n\nName: {{entry-1.name}}\nCompany: {{entry-1.company}}\nRole: {{entry-1.role}}\nSize: {{entry-1.company_size}}\nMessage: {{entry-1.message}}","outputType":"text","outputStructure":"","hasTemplate":false}},{"id":"conditional-1","type":"conditional","label":"Hot Lead?","x":700,"y":200,"conditionConfig":{"leftValue":"{{ai-1.output}}","operator":"contains","rightValue":"Hot"}},{"id":"slack-1","type":"slack","label":"Alert Sales Team","x":1000,"y":100,"slackConfig":{"channel":"#sales-hot-leads","message":"🔥 HOT LEAD!\n\n**{{entry-1.name}}**\n{{entry-1.role}} at {{entry-1.company}}\n\n{{ai-1.output}}"}},{"id":"email-1","type":"email","label":"Send to CRM","x":1000,"y":300,"emailConfig":{"to":[],"subject":"New Lead: {{entry-1.name}}","message":"{{ai-1.output}}"}}]',
  '[{"from":"entry-1","to":"ai-1"},{"from":"ai-1","to":"conditional-1"},{"from":"conditional-1","to":"slack-1","sourceHandle":"true"},{"from":"conditional-1","to":"email-1","sourceHandle":"false"}]',
  '### Setup Instructions

1. Configure Slack #sales-hot-leads channel
2. Add CRM email for lead logging
3. Customize AI scoring for your ICP
4. Connect to landing pages/forms',
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

1. Add recipient emails in the Email node
2. Copy the webhook URL
3. Configure your service to POST data

### Example:
```bash
curl -X POST YOUR_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d ''{"subject": "Alert", "message": "Test"}''
```',
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
  '[{"id":"entry-1","type":"entry","label":"Question Received","x":100,"y":200,"entryType":"webhook","fields":[{"id":"f1","key":"customer_email","name":"customer_email","type":"email","label":"Customer Email"},{"id":"f2","key":"customer_name","name":"customer_name","type":"text","label":"Customer Name"},{"id":"f3","key":"question","name":"question","type":"textarea","label":"Question"}]},{"id":"ai-1","type":"ai","label":"Generate Answer","x":400,"y":200,"aiConfig":{"model":"google/gemini-2.0-flash-001","systemPrompt":"You are a helpful customer support agent.","userPrompt":"Question: {{entry-1.question}}\n\nProvide a helpful answer.","outputType":"text","outputStructure":"","hasTemplate":false}},{"id":"email-1","type":"email","label":"Send Response","x":700,"y":200,"emailConfig":{"to":[],"subject":"Re: Your Question","message":"Hi {{entry-1.customer_name}},\n\n{{ai-1.output}}\n\nBest,\nSupport Team"}}]',
  '[{"from":"entry-1","to":"ai-1"},{"from":"ai-1","to":"email-1"}]',
  '### Setup Instructions

1. Update AI system prompt with product info
2. Add common FAQs to the prompt
3. Set customer_email as recipient
4. Test with sample questions',
  now(),
  now()
),
(
  'Daily Report Generator',
  'Automatically compile and send daily digest emails with AI-generated summaries of key metrics.',
  'daily-report-generator',
  'data-processing',
  '["ai", "email", "analytics", "reporting"]',
  '📊',
  'official',
  'ZeitFlow Team',
  '[{"id":"entry-1","type":"entry","label":"Data Input","x":100,"y":200,"entryType":"webhook","fields":[{"id":"f1","key":"date","name":"date","type":"text","label":"Date"},{"id":"f2","key":"revenue","name":"revenue","type":"text","label":"Revenue"},{"id":"f3","key":"signups","name":"signups","type":"text","label":"Signups"},{"id":"f4","key":"users","name":"users","type":"text","label":"Active Users"}]},{"id":"ai-1","type":"ai","label":"Generate Summary","x":400,"y":200,"aiConfig":{"model":"google/gemini-2.0-flash-001","systemPrompt":"You are a business analyst.","userPrompt":"Create a summary for {{entry-1.date}}:\nRevenue: {{entry-1.revenue}}\nSignups: {{entry-1.signups}}\nUsers: {{entry-1.users}}","outputType":"text","outputStructure":"","hasTemplate":false}},{"id":"email-1","type":"email","label":"Send Report","x":700,"y":200,"emailConfig":{"to":[],"subject":"Daily Report - {{entry-1.date}}","message":"{{ai-1.output}}"}}]',
  '[{"from":"entry-1","to":"ai-1"},{"from":"ai-1","to":"email-1"}]',
  '### Setup Instructions

1. Connect analytics platform
2. Schedule daily webhook trigger
3. Add leadership emails
4. Customize metrics',
  now(),
  now()
);
