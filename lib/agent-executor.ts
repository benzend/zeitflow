/**
 * Agent Executor
 *
 * Core execution logic for agent nodes. Uses Vercel AI SDK's generateText()
 * with tool calling and step limits for an agentic loop.
 */

import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, ModelMessage, stepCountIs } from 'ai';
import { AgentNodeConfig } from './workflow-types';
import { buildAgentTools, AgentToolContext } from './agent-tools';
import { IntegrationLogger } from './integrations/types';

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY is not set');
}

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': 'https://zeitflow.io',
    'X-Title': 'ZeitFlow',
    'Content-Type': 'application/json',
  },
});

export interface AgentToolCall {
  toolName: string;
  args: unknown;
  result: unknown;
  durationMs: number;
}

export interface AgentExecutionResult {
  response: string;
  toolCalls: AgentToolCall[];
  totalSteps: number;
  error?: string;
}

export interface AgentExecutionContext {
  userId: string;
  executionId: string;
  nodeId: string;
  variables: Record<string, unknown>;
  logger: IntegrationLogger;
  db?: unknown;
}

/**
 * Execute an agent node with tool calling
 */
export async function executeAgent(
  config: AgentNodeConfig,
  context: AgentExecutionContext
): Promise<AgentExecutionResult> {
  const toolCalls: AgentToolCall[] = [];

  const toolContext: AgentToolContext = {
    userId: context.userId,
    executionId: context.executionId,
    nodeId: context.nodeId,
    variables: context.variables,
    logger: context.logger,
    db: context.db,
  };

  // Build tools from config
  const tools = buildAgentTools(config.tools, toolContext);
  const toolCount = Object.keys(tools).length;

  context.logger.info(`Agent starting with ${toolCount} tools`, {
    model: config.model,
    temperature: config.temperature,
    maxSteps: config.maxSteps,
    toolNames: Object.keys(tools),
  });

  // Build messages
  const messages: ModelMessage[] = [];
  if (config.systemPrompt) {
    messages.push({ role: 'system', content: config.systemPrompt });
  }
  messages.push({ role: 'user', content: config.userPrompt });

  try {
    // Cap maxSteps to a safe limit
    const maxSteps = Math.min(Math.max(config.maxSteps || 5, 1), 20);

    const endTimer = context.logger.startTimer('Agent execution');

    const result = await generateText({
      model: openrouter(config.model),
      messages,
      tools: toolCount > 0 ? tools : undefined,
      stopWhen: stepCountIs(maxSteps),
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens,
    });

    endTimer();

    // Extract tool calls from steps
    if (result.steps) {
      for (const step of result.steps) {
        if (step.toolCalls) {
          for (const tc of step.toolCalls) {
            toolCalls.push({
              toolName: tc.toolName,
              args: tc.args,
              result: step.toolResults?.find(
                (tr: { toolCallId: string }) => tr.toolCallId === tc.toolCallId
              )?.result,
              durationMs: 0,
            });
          }
        }
      }
    }

    context.logger.info(`Agent completed`, {
      totalSteps: result.steps?.length || 1,
      toolCallCount: toolCalls.length,
      responseLength: result.text?.length || 0,
    });

    return {
      response: result.text,
      toolCalls,
      totalSteps: result.steps?.length || 1,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown agent error';
    context.logger.error(`Agent execution failed: ${errorMsg}`);

    return {
      response: '',
      toolCalls,
      totalSteps: 0,
      error: errorMsg,
    };
  }
}
