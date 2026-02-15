import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, ModelMessage, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { db } from '@/lib/db';
import { workflowsTable, chatEventsTable } from '@/schema';
import { eq, desc } from 'drizzle-orm';

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY is not set');
}

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://zeitflow.io",
    "X-Title": "ZeitFlow",
    "Content-Type": "application/json",
  }
});

// Define the workflow node schema for validation
const fieldSchema = z.object({
  name: z.string(),
  label: z.string().optional(),
  type: z.enum(['text', 'textarea', 'select', 'number', 'email']).default('text'),
  options: z.array(z.string()).optional(),
});

const aiConfigSchema = z.object({
  systemPrompt: z.string(),
  userPrompt: z.string().optional(),
  model: z.string().optional(),
  outputType: z.enum(['text', 'structured']).optional(),
});

const schedulerConfigSchema = z.object({
  people: z.array(z.string()),
  minTimeRequirement: z.string(),
  calendar: z.string().default('primary'),
});

const emailConfigSchema = z.object({
  to: z.array(z.string()),
  subject: z.string().optional(),
  message: z.string().optional(),
});

const slackConfigSchema = z.object({
  channel: z.string(),
  message: z.string().optional(),
});

const smsConfigSchema = z.object({
  to: z.array(z.string()),
  message: z.string().optional(),
});

const workflowNodeSchema = z.object({
  type: z.enum(['entry', 'ai', 'scheduler', 'review', 'slack', 'email', 'sms']),
  label: z.string().optional(),
  // Type-specific configs
  fields: z.array(fieldSchema).optional().describe('For entry nodes: form fields to collect'),
  aiConfig: aiConfigSchema.optional().describe('For ai nodes: AI processing configuration'),
  schedulerConfig: schedulerConfigSchema.optional().describe('For scheduler nodes: meeting scheduling config'),
  emailConfig: emailConfigSchema.optional().describe('For email nodes: email configuration'),
  slackConfig: slackConfigSchema.optional().describe('For slack nodes: Slack message config'),
  smsConfig: smsConfigSchema.optional().describe('For sms nodes: SMS configuration'),
});

const workflowProposalSchema = z.object({
  name: z.string().describe('Name of the workflow'),
  description: z.string().optional().describe('Description of what the workflow does'),
  nodes: z.array(workflowNodeSchema).describe('Array of workflow nodes. Each node should have type-specific config (e.g., fields for entry, aiConfig for ai)'),
});

const planProposalSchema = z.object({
  title: z.string().describe('Short title for the plan'),
  description: z.string().describe('What this workflow will accomplish'),
  steps: z.array(z.object({
    action: z.string().describe('What this step does'),
    rationale: z.string().optional().describe('Why this step is needed'),
  })).describe('Sequential steps the workflow will execute'),
});

export interface AgentToolCall {
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
}

export interface AgentResponse {
  text: string;
  toolCalls: AgentToolCall[];
  proposedWorkflow?: z.infer<typeof workflowProposalSchema>;
  proposedPlan?: z.infer<typeof planProposalSchema>;
  error?: boolean;
}

export const agenticChat = async (
  prompt: string,
  model: string,
  options: {
    systemPrompt?: string;
    history?: ModelMessage[];
    userId: string;
    threadId?: number;
  }
): Promise<AgentResponse> => {
  const toolCalls: AgentToolCall[] = [];
  let proposedWorkflow: z.infer<typeof workflowProposalSchema> | undefined;
  let proposedPlan: z.infer<typeof planProposalSchema> | undefined;

  try {
    const messages: ModelMessage[] = [];

    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt
      });
    }

    if (options.history) {
      messages.push(...options.history);
    }

    messages.push({
      role: 'user',
      content: prompt
    });

    const result = await generateText({
      model: openrouter(model),
      messages,
      stopWhen: stepCountIs(5), // Allow up to 5 agentic steps
      tools: {
        // Tool: List user's existing workflows
        list_workflows: tool({
          description: 'List all workflows the user has created. Use this to understand what workflows already exist before creating new ones.',
          inputSchema: z.object({}) as any,
          execute: async () => {
            const workflows = await db.select({
              id: workflowsTable.id,
              name: workflowsTable.name,
              description: workflowsTable.description,
              status: workflowsTable.status,
            })
              .from(workflowsTable)
              .where(eq(workflowsTable.userId, options.userId))
              .limit(20);

            const result = {
              workflows: workflows.map(w => ({
                id: w.id,
                name: w.name,
                description: w.description,
                status: w.status,
              })),
              count: workflows.length,
            };

            toolCalls.push({
              toolName: 'list_workflows',
              args: {},
              result,
            });

            return result;
          },
        }),

        // Tool: Propose a high-level plan before implementing a workflow
        propose_plan: tool({
          description: 'Propose a high-level plan for a workflow before implementation. Use this FIRST to outline what the workflow will do. After user approval, use propose_workflow for the concrete implementation.',
          inputSchema: planProposalSchema,
          execute: async (args) => {
            proposedPlan = args;

            if (options.threadId) {
              await db.insert(chatEventsTable).values({
                threadId: options.threadId,
                userId: options.userId,
                eventType: 'workflow_plan_proposed',
                proposalData: JSON.stringify(args),
              });
            }

            const result = {
              status: 'plan_proposed',
              message: 'Plan proposed for review. User must approve before workflow creation.',
              plan: { title: args.title, stepCount: args.steps.length },
            };

            toolCalls.push({
              toolName: 'propose_plan',
              args,
              result,
            });

            return result;
          },
        }),

        // Tool: Propose a new workflow for user approval
        propose_workflow: tool({
          description: 'Propose a new workflow for the user to review and approve. The workflow will NOT be created until the user explicitly approves it. Use this when the user wants to create a new workflow.',
          inputSchema: workflowProposalSchema,
          execute: async (args) => {
            // Store the proposed workflow for the response
            proposedWorkflow = args;

            // Log the workflow_proposed event if threadId is available
            if (options.threadId) {
              await db.insert(chatEventsTable).values({
                threadId: options.threadId,
                userId: options.userId,
                eventType: 'workflow_proposed',
                proposalData: JSON.stringify(args),
              });
            }

            const result = {
              status: 'proposed',
              message: 'Workflow has been proposed for review. The user must approve it before creation.',
              proposal: {
                name: args.name,
                description: args.description,
                nodeCount: args.nodes.length,
                nodeTypes: args.nodes.map(n => n.type),
              },
            };

            toolCalls.push({
              toolName: 'propose_workflow',
              args,
              result,
            });

            return result;
          },
        }),

        // Tool: Search/query about workflow capabilities
        get_capabilities: tool({
          description: 'Get information about what node types and capabilities are available for building workflows.',
          inputSchema: z.object({}),
          execute: async () => {
            const result = {
              nodeTypes: [
                {
                  type: 'entry',
                  description: 'Collect user input via form fields',
                  requiredConfig: ['fields'],
                  example: { fields: [{ name: 'notes', label: 'Notes', type: 'textarea' }] },
                },
                {
                  type: 'ai',
                  description: 'Process data with AI',
                  requiredConfig: ['systemPrompt'],
                  optionalConfig: ['model', 'userPrompt', 'outputType'],
                  example: { systemPrompt: 'Summarize the following text', model: 'google/gemini-2.0-flash-001' },
                },
                {
                  type: 'scheduler',
                  description: 'Schedule meetings via Google Calendar',
                  requiredConfig: ['people', 'minTimeRequirement', 'calendar'],
                  example: { people: ['user@example.com'], minTimeRequirement: '30 minutes', calendar: 'primary' },
                },
                {
                  type: 'review',
                  description: 'Pause for human review and approval',
                  requiredConfig: [],
                },
                {
                  type: 'slack',
                  description: 'Send message to Slack channel',
                  requiredConfig: ['channel'],
                  example: { channel: 'general' },
                },
                {
                  type: 'email',
                  description: 'Send email notification',
                  requiredConfig: ['to', 'subject'],
                  example: { to: '{{entry.fields.email}}', subject: 'Notification' },
                },
                {
                  type: 'sms',
                  description: 'Send SMS message',
                  requiredConfig: ['to', 'message'],
                  example: { to: '+1234567890', message: 'Hello!' },
                },
              ],
              variableSystem: 'Use {{nodeName.field}} to reference outputs from previous nodes. Entry node fields are accessed via {{entry.fields.fieldName}}.',
            };

            toolCalls.push({
              toolName: 'get_capabilities',
              args: {},
              result,
            });

            return result;
          },
        }),

        // Tool: Get thread events to understand conversation history
        get_thread_events: tool({
          description: 'Get the event history for the current conversation thread. Use this to understand what plans and workflows have been proposed, approved, or rejected in this conversation. Check for workflow_plan_approved events to know when to proceed with propose_workflow.',
          inputSchema: z.object({}),
          execute: async () => {
            if (!options.threadId) {
              return {
                events: [],
                summary: {
                  planProposed: 0, planApproved: 0, planRejected: 0,
                  workflowProposed: 0, workflowApproved: 0, workflowRejected: 0,
                },
                message: 'No thread context available.',
              };
            }

            const events = await db.select()
              .from(chatEventsTable)
              .where(eq(chatEventsTable.threadId, options.threadId))
              .orderBy(desc(chatEventsTable.createdAt))
              .limit(50);

            const summary = {
              planProposed: events.filter(e => e.eventType === 'workflow_plan_proposed').length,
              planApproved: events.filter(e => e.eventType === 'workflow_plan_approved').length,
              planRejected: events.filter(e => e.eventType === 'workflow_plan_rejected').length,
              workflowProposed: events.filter(e => e.eventType === 'workflow_proposed').length,
              workflowApproved: events.filter(e => e.eventType === 'workflow_approved').length,
              workflowRejected: events.filter(e => e.eventType === 'workflow_rejected').length,
            };

            const result = {
              events: events.map(e => ({
                eventType: e.eventType,
                workflowId: e.workflowId,
                proposalData: e.proposalData ? JSON.parse(e.proposalData) : null,
                metadata: e.metadata ? JSON.parse(e.metadata) : null,
                createdAt: e.createdAt,
              })),
              summary,
            };

            toolCalls.push({
              toolName: 'get_thread_events',
              args: {},
              result,
            });

            return result;
          },
        }),
      },
    });

    return {
      text: result.text,
      toolCalls,
      proposedWorkflow,
      proposedPlan,
    };

  } catch (error) {
    console.error('Agentic chat error:', error);
    return {
      text: 'Sorry, there was an error processing your request. Please try again.',
      toolCalls,
      error: true,
    };
  }
};
