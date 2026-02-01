import { db } from '../lib/db';
import { workflowTemplatesTable } from '../schema';

const templates = [
  {
    name: 'Customer Support Ticket Router',
    description: 'Intelligently route incoming support tickets to the right team based on AI analysis of urgency, category, and sentiment.',
    slug: 'customer-support-ticket-router',
    category: 'customer-support',
    tags: JSON.stringify(['ai', 'slack', 'support', 'routing']),
    icon: '🎧',
    visibility: 'official',
    authorName: 'ZeitFlow Team',
    nodes: JSON.stringify([{"id":"entry-1","type":"entry","label":"New Ticket","x":100,"y":200,"entryType":"webhook","fields":[{"id":"f1","key":"customer_name","name":"customer_name","type":"text","label":"Customer Name"},{"id":"f2","key":"issue","name":"issue","type":"textarea","label":"Issue Description"},{"id":"f3","key":"email","name":"email","type":"email","label":"Customer Email"}]},{"id":"ai-1","type":"ai","label":"Analyze Ticket","x":400,"y":200,"aiConfig":{"model":"google/gemini-2.0-flash-001","systemPrompt":"You are a support ticket classifier. Analyze tickets and categorize them.","userPrompt":"Analyze this support ticket and provide:\n1. Urgency (Low/Medium/High/Critical)\n2. Category (Technical/Billing/Sales/General)\n3. Sentiment (Positive/Neutral/Negative)\n4. Suggested team (Engineering/Finance/Sales/Support)\n\nTicket from {{entry-1.customer_name}} ({{entry-1.email}}):\n{{entry-1.issue}}","outputType":"text","outputStructure":"","hasTemplate":false}},{"id":"condition-1","type":"condition","label":"Check Urgency","x":700,"y":200,"conditionConfig":{"leftValue":"{{ai-1.output}}","operator":"contains","rightValue":"Critical"}},{"id":"slack-1","type":"slack","label":"Alert Urgent Team","x":1000,"y":100,"slackConfig":{"channel":"#support-urgent","message":"🚨 CRITICAL TICKET\n\nCustomer: {{entry-1.customer_name}}\nEmail: {{entry-1.email}}\n\nAI Analysis:\n{{ai-1.output}}\n\nIssue:\n{{entry-1.issue}}"}},{"id":"slack-2","type":"slack","label":"Route to Team","x":1000,"y":300,"slackConfig":{"channel":"#support-general","message":"📬 New Support Ticket\n\nCustomer: {{entry-1.customer_name}}\nEmail: {{entry-1.email}}\n\nAI Analysis:\n{{ai-1.output}}\n\nIssue:\n{{entry-1.issue}}"}}]),
    connections: JSON.stringify([{"from":"entry-1","to":"ai-1"},{"from":"ai-1","to":"condition-1"},{"from":"condition-1","to":"slack-1","sourceHandle":"true"},{"from":"condition-1","to":"slack-2","sourceHandle":"false"}]),
    instructions: '### Setup Instructions\n\n1. Configure Slack Integration\n2. Setup webhook\n3. Customize AI prompt',
    updatedAt: new Date(),
  },
  {
    name: 'Lead Qualification System',
    description: 'Automatically score and qualify sales leads using AI, then route high-value prospects to your sales team.',
    slug: 'lead-qualification-system',
    category: 'sales',
    tags: JSON.stringify(['ai', 'sales', 'crm', 'email', 'slack']),
    icon: '💰',
    visibility: 'official',
    authorName: 'ZeitFlow Team',
    nodes: JSON.stringify([{"id":"entry-1","type":"entry","label":"New Lead","x":100,"y":200,"entryType":"webhook","fields":[{"id":"f1","key":"name","name":"name","type":"text","label":"Full Name"},{"id":"f2","key":"email","name":"email","type":"email","label":"Email"},{"id":"f3","key":"company","name":"company","type":"text","label":"Company"}]},{"id":"ai-1","type":"ai","label":"Score Lead","x":400,"y":200,"aiConfig":{"model":"google/gemini-2.0-flash-001","systemPrompt":"You are a sales lead qualifier.","userPrompt":"Score this lead","outputType":"text","outputStructure":"","hasTemplate":false}},{"id":"condition-1","type":"condition","label":"Hot Lead?","x":700,"y":200,"conditionConfig":{"leftValue":"{{ai-1.output}}","operator":"contains","rightValue":"Hot"}},{"id":"slack-1","type":"slack","label":"Alert Sales","x":1000,"y":100,"slackConfig":{"channel":"#sales-hot-leads","message":"🔥 HOT LEAD!\n\n{{entry-1.name}}"}},{"id":"email-1","type":"email","label":"Send to CRM","x":1000,"y":300,"emailConfig":{"to":[],"subject":"New Lead","message":"{{ai-1.output}}"}}]),
    connections: JSON.stringify([{"from":"entry-1","to":"ai-1"},{"from":"ai-1","to":"condition-1"},{"from":"condition-1","to":"slack-1","sourceHandle":"true"},{"from":"condition-1","to":"email-1","sourceHandle":"false"}]),
    instructions: '### Setup Instructions\n\n1. Configure Slack\n2. Add CRM email\n3. Customize AI scoring',
    updatedAt: new Date(),
  },
  {
    name: 'Simple Webhook to Email',
    description: 'The simplest workflow - receive webhook data and forward it via email. Perfect for notifications and alerts.',
    slug: 'simple-webhook-to-email',
    category: 'communication',
    tags: JSON.stringify(['email', 'webhook', 'notification']),
    icon: '📬',
    visibility: 'official',
    authorName: 'ZeitFlow Team',
    nodes: JSON.stringify([{"id":"entry-1","type":"entry","label":"Webhook Trigger","x":100,"y":200,"entryType":"webhook","fields":[{"id":"f1","key":"subject","name":"subject","type":"text","label":"Email Subject"},{"id":"f2","key":"message","name":"message","type":"textarea","label":"Message Body"}]},{"id":"email-1","type":"email","label":"Send Email","x":400,"y":200,"emailConfig":{"to":[],"subject":"{{entry-1.subject}}","message":"{{entry-1.message}}"}}]),
    connections: JSON.stringify([{"from":"entry-1","to":"email-1"}]),
    instructions: '### Setup Instructions\n\n1. Add recipient emails\n2. Copy webhook URL\n3. Test with curl',
    updatedAt: new Date(),
  },
  {
    name: 'AI-Powered FAQ Responder',
    description: 'Automatically respond to common questions using AI to generate helpful, context-aware answers.',
    slug: 'ai-powered-faq-responder',
    category: 'customer-support',
    tags: JSON.stringify(['ai', 'email', 'support', 'automation']),
    icon: '🤖',
    visibility: 'official',
    authorName: 'ZeitFlow Team',
    nodes: JSON.stringify([{"id":"entry-1","type":"entry","label":"Question Received","x":100,"y":200,"entryType":"webhook","fields":[{"id":"f1","key":"customer_email","name":"customer_email","type":"email","label":"Customer Email"},{"id":"f2","key":"customer_name","name":"customer_name","type":"text","label":"Customer Name"},{"id":"f3","key":"question","name":"question","type":"textarea","label":"Question"}]},{"id":"ai-1","type":"ai","label":"Generate Answer","x":400,"y":200,"aiConfig":{"model":"google/gemini-2.0-flash-001","systemPrompt":"You are a helpful support agent.","userPrompt":"Question: {{entry-1.question}}","outputType":"text","outputStructure":"","hasTemplate":false}},{"id":"email-1","type":"email","label":"Send Response","x":700,"y":200,"emailConfig":{"to":[],"subject":"Re: Your Question","message":"Hi {{entry-1.customer_name}},\n\n{{ai-1.output}}\n\nBest,\nSupport"}}]),
    connections: JSON.stringify([{"from":"entry-1","to":"ai-1"},{"from":"ai-1","to":"email-1"}]),
    instructions: '### Setup Instructions\n\n1. Update AI system prompt\n2. Add FAQs to prompt\n3. Test with sample questions',
    updatedAt: new Date(),
  },
  {
    name: 'Daily Report Generator',
    description: 'Automatically compile and send daily digest emails with AI-generated summaries of key metrics.',
    slug: 'daily-report-generator',
    category: 'data-processing',
    tags: JSON.stringify(['ai', 'email', 'analytics', 'reporting']),
    icon: '📊',
    visibility: 'official',
    authorName: 'ZeitFlow Team',
    nodes: JSON.stringify([{"id":"entry-1","type":"entry","label":"Data Input","x":100,"y":200,"entryType":"webhook","fields":[{"id":"f1","key":"date","name":"date","type":"text","label":"Date"},{"id":"f2","key":"revenue","name":"revenue","type":"text","label":"Revenue"},{"id":"f3","key":"signups","name":"signups","type":"text","label":"Signups"}]},{"id":"ai-1","type":"ai","label":"Generate Summary","x":400,"y":200,"aiConfig":{"model":"google/gemini-2.0-flash-001","systemPrompt":"You are a business analyst.","userPrompt":"Create summary for {{entry-1.date}}","outputType":"text","outputStructure":"","hasTemplate":false}},{"id":"email-1","type":"email","label":"Send Report","x":700,"y":200,"emailConfig":{"to":[],"subject":"Daily Report - {{entry-1.date}}","message":"{{ai-1.output}}"}}]),
    connections: JSON.stringify([{"from":"entry-1","to":"ai-1"},{"from":"ai-1","to":"email-1"}]),
    instructions: '### Setup Instructions\n\n1. Connect analytics platform\n2. Schedule daily trigger\n3. Add team emails',
    updatedAt: new Date(),
  },
];

async function seedTemplates() {
  console.log('Checking existing templates...');

  // Check current database
  const dbCheck = await db.execute(`SELECT current_database() as db, COUNT(*) as count FROM workflow_templates`);
  console.log('Connected to database:', dbCheck.rows[0]);

  // Delete existing official templates
  console.log('Clearing old official templates...');
  await db.execute(`DELETE FROM workflow_templates WHERE visibility = 'official'`);

  console.log('Inserting new templates...');
  for (const template of templates) {
    await db.insert(workflowTemplatesTable).values(template);
    console.log(`✓ Inserted: ${template.name}`);
  }

  console.log('\nDone! Templates seeded successfully.');
  process.exit(0);
}

seedTemplates().catch(err => {
  console.error('Error seeding templates:', err);
  process.exit(1);
});
