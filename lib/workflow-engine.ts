/**
 * Pure workflow graph and variable logic used by `pages/api/workflow/[id]/execute.ts`.
 *
 * These functions were moved out of the request handler so the Rust `zf-core`
 * crate can be checked against the same code the API runs. Keep the behavior
 * identical to that handler: entry selection, the BFS walk, variable
 * collection, and `substituteVariables` (the engine implementation, not
 * `lib/integrations/executor.ts`).
 */

import { extractVariables } from "@/lib/variables-client";

export interface WorkflowConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  entryType?: string;
  config?: string;
}

/**
 * Convert node label to variable name (matches frontend logic)
 */
export function labelToVariableName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Collects available variables from ALL upstream ancestor nodes (not just direct predecessors).
 * Uses BFS to traverse the full upstream graph so that variables from earlier nodes
 * (e.g., entry node data) are available in downstream nodes like email/slack.
 * Returns nested structure matching autocomplete: {node_name: {field: value}}
 */
export function collectAvailableVariables(
  nodeId: string,
  connections: WorkflowConnection[],
  nodes: WorkflowNode[],
  inputData: Record<string, unknown>,
  nodeOutputs: Record<string, unknown>,
): Record<string, unknown> {
  const variables: Record<string, unknown> = {};

  // BFS to find all upstream ancestor nodes
  const visited = new Set<string>();
  const queue: string[] = [];

  // Start with direct incoming connections
  const directIncoming = connections.filter((edge) => edge.toNodeId === nodeId);
  for (const edge of directIncoming) {
    if (!visited.has(edge.fromNodeId)) {
      visited.add(edge.fromNodeId);
      queue.push(edge.fromNodeId);
    }
  }

  // Traverse upstream
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const incomingToThis = connections.filter((edge) => edge.toNodeId === currentId);
    for (const edge of incomingToThis) {
      if (!visited.has(edge.fromNodeId)) {
        visited.add(edge.fromNodeId);
        queue.push(edge.fromNodeId);
      }
    }
  }

  // For each upstream ancestor, collect its variables
  for (const ancestorId of visited) {
    const sourceNode = nodes.find((n) => n.id === ancestorId);
    if (sourceNode) {
      const config = JSON.parse(sourceNode.config || "{}");
      const nodeLabel = sourceNode.label || sourceNode.id;
      const varName = labelToVariableName(nodeLabel);

      // Add variables from entry nodes
      if (sourceNode.type === "entry") {
        if (
          sourceNode.entryType === "api" ||
          sourceNode.entryType === "form" ||
          sourceNode.entryType === "webhook"
        ) {
          // Create nested object for entry node
          const entryVars: Record<string, unknown> = {};

          // Add input data fields
          if (inputData && typeof inputData === "object") {
            Object.keys(inputData).forEach((key) => {
              entryVars[key] = inputData[key];
            });
          }

          // Add fields from entry node configuration
          if (config.fields && Array.isArray(config.fields)) {
            config.fields.forEach((field: { key: string }) => {
              if (inputData && inputData[field.key]) {
                entryVars[field.key] = inputData[field.key];
              }
            });
          }

          variables[varName] = entryVars;
        }
      }

      // Add AI output variables
      if (sourceNode.type === "ai" && nodeOutputs[sourceNode.id]) {
        const nodeOutput = nodeOutputs[sourceNode.id] as { response?: string };
        variables[varName] = {
          output: nodeOutput.response || "",
        };
      }

      // Add scheduler output variables
      if (sourceNode.type === "scheduler" && nodeOutputs[sourceNode.id]) {
        const schedulerOutput = nodeOutputs[sourceNode.id] as {
          scheduledTime?: string;
          calendarLink?: string;
        };
        variables[varName] = {
          eventId: schedulerOutput.scheduledTime || "",
          eventLink: schedulerOutput.calendarLink || "",
          scheduledTime: schedulerOutput.scheduledTime || "",
        };
      }

      // Add email output variables
      if (sourceNode.type === "email" && nodeOutputs[sourceNode.id]) {
        const emailOutput = nodeOutputs[sourceNode.id] as { success?: boolean; error?: string };
        variables[varName] = {
          messageId: "", // Would need to be captured from email service
          status: emailOutput.success ? "sent" : "failed",
        };
      }

      // Add slack output variables
      if (sourceNode.type === "slack" && nodeOutputs[sourceNode.id]) {
        const slackOutput = nodeOutputs[sourceNode.id] as {
          success?: boolean;
          error?: string;
          messageId?: string;
          channel?: string;
        };
        variables[varName] = {
          messageId: slackOutput.messageId || "",
          channel: slackOutput.channel || "",
          timestamp: "", // Would need to be captured from Slack response
        };
      }

      // Add SMS output variables
      if (sourceNode.type === "sms" && nodeOutputs[sourceNode.id]) {
        const smsOutput = nodeOutputs[sourceNode.id] as {
          success?: boolean;
          error?: string;
          messageId?: string;
        };
        variables[varName] = {
          messageId: smsOutput.messageId || "",
          status: smsOutput.success ? "sent" : "failed",
        };
      }

      // Add Telegram output variables
      if (sourceNode.type === "telegram" && nodeOutputs[sourceNode.id]) {
        const telegramOutput = nodeOutputs[sourceNode.id] as {
          success?: boolean;
          error?: string;
          messageId?: number;
          chatId?: string;
        };
        variables[varName] = {
          messageId: telegramOutput.messageId?.toString() || "",
          chatId: telegramOutput.chatId || "",
        };
      }

      // Add condition output variables
      if (sourceNode.type === "condition" && nodeOutputs[sourceNode.id]) {
        const conditionOutput = nodeOutputs[sourceNode.id] as {
          result?: boolean;
          leftValue?: unknown;
          rightValue?: unknown;
        };
        variables[varName] = {
          result: conditionOutput.result || false,
          leftValue: conditionOutput.leftValue,
          rightValue: conditionOutput.rightValue,
        };
      }

      // Add review output variables
      if (sourceNode.type === "review" && nodeOutputs[sourceNode.id]) {
        const reviewOutput = nodeOutputs[sourceNode.id] as { approved?: boolean; feedback?: string };
        variables[varName] = {
          approved: reviewOutput.approved || false,
          feedback: reviewOutput.feedback || "",
        };
      }

      // Generic fallback: for any integration node type not explicitly handled above,
      // expose all stored output fields as variables. This covers youtube, discord,
      // http_request, google_sheets, github, notion, airtable, whatsapp, jira,
      // hubspot, webhook, linear, google_drive, stripe, shopify, and any future integrations.
      if (!variables[varName] && nodeOutputs[sourceNode.id]) {
        const output = nodeOutputs[sourceNode.id];
        if (output && typeof output === "object") {
          variables[varName] = { ...(output as Record<string, unknown>) };
        }
      }
    }
  }

  return variables;
}

/**
 * Substitutes variables in a prompt string with their values.
 * Supports nested paths like {{node.field}}.
 *
 * This is the engine implementation used for AI prompts. It is not the same
 * function as `substituteVariables` in `lib/integrations/executor.ts`.
 * Differences are documented in `engine/README.md`.
 */
export function substituteVariables(prompt: string, variables: Record<string, unknown>): string {
  let processedPrompt = prompt;

  // Extract all variables from the prompt
  const extractedVars = extractVariables(prompt);

  // Replace each variable with its value
  extractedVars.forEach((varName) => {
    // Escape special regex characters in variable name
    const escapedVarName = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\{\\{${escapedVarName}\\}\\}`, "g");

    // Handle nested paths (e.g., "new_ticket.customer_name")
    let value: unknown = variables;
    const parts = varName.split(".");

    for (const part of parts) {
      if (value === null || value === undefined) {
        value = undefined;
        break;
      }
      if (typeof value === "object" && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        value = undefined;
        break;
      }
    }

    if (value !== undefined && value !== null) {
      // Convert to string, handling objects
      const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);
      processedPrompt = processedPrompt.replace(regex, stringValue);
    } else {
      console.warn(
        `Variable "${varName}" not found in available variables. Available:`,
        Object.keys(variables),
      );
      // Replace with empty string if variable not found
      processedPrompt = processedPrompt.replace(regex, "");
    }
  });

  return processedPrompt;
}

interface GraphStructures {
  inDegree: Map<string, number>;
  adjacencyList: Map<string, WorkflowConnection[]>;
  nodeMap: Map<string, WorkflowNode>;
}

/**
 * Builds graph data structures for BFS traversal
 */
function buildGraphStructures(nodes: WorkflowNode[], connections: WorkflowConnection[]): GraphStructures {
  const inDegree = new Map<string, number>();
  const adjacencyList = new Map<string, WorkflowConnection[]>();
  const nodeMap = new Map<string, WorkflowNode>();

  // Initialize all nodes with in-degree 0 and empty adjacency list
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacencyList.set(node.id, []);
    nodeMap.set(node.id, node);
  }

  // Build in-degree counts and adjacency lists (store full connection objects)
  for (const conn of connections) {
    inDegree.set(conn.toNodeId, (inDegree.get(conn.toNodeId) || 0) + 1);
    adjacencyList.get(conn.fromNodeId)?.push(conn);
  }

  return { inDegree, adjacencyList, nodeMap };
}

/**
 * Finds root nodes (nodes with no incoming connections)
 */
function findRootNodes(inDegree: Map<string, number>): string[] {
  const rootNodes: string[] = [];
  for (const [nodeId, degree] of inDegree.entries()) {
    if (degree === 0) {
      rootNodes.push(nodeId);
    }
  }
  return rootNodes;
}

/**
 * Validates that all referenced nodes in connections exist in the nodes array
 */
function validateNodesExist(nodes: WorkflowNode[], connections: WorkflowConnection[]) {
  const nodeIds = new Set(nodes.map((n) => n.id));
  for (const conn of connections) {
    if (!nodeIds.has(conn.fromNodeId)) {
      throw new Error(`Invalid connection: fromNodeId ${conn.fromNodeId} does not exist`);
    }
    if (!nodeIds.has(conn.toNodeId)) {
      throw new Error(`Invalid connection: toNodeId ${conn.toNodeId} does not exist`);
    }
  }
}

export interface PreparedExecution {
  inDegree: Map<string, number>;
  adjacencyList: Map<string, WorkflowConnection[]>;
  nodeMap: Map<string, WorkflowNode>;
  startNodes: string[];
}

/**
 * Validate the graph, choose the entry node, and restrict in-degrees to the
 * executable subgraph. Same decisions `executeWorkflow` makes before the loop.
 */
export function prepareExecution(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[],
  entryNodeId?: string,
): PreparedExecution {
  const { inDegree, adjacencyList, nodeMap } = buildGraphStructures(nodes, connections);

  validateNodesExist(nodes, connections);
  const rootNodes = findRootNodes(inDegree);

  if (rootNodes.length === 0) {
    throw new Error("No entry nodes found (all nodes have incoming connections). Check for cycles.");
  }

  // Filter to specific entry node if provided
  let startNodes = rootNodes;
  if (entryNodeId) {
    if (!rootNodes.includes(entryNodeId)) {
      throw new Error(`Invalid entryNodeId: ${entryNodeId} is not a valid entry point`);
    }
    startNodes = [entryNodeId];
  } else if (rootNodes.length > 1) {
    // Multiple entries but none specified - error
    const rootNodeLabels = rootNodes
      .map((id) => nodeMap.get(id))
      .filter((node): node is WorkflowNode => Boolean(node))
      .map((n) => `${n.label} (${n.id})`)
      .join(", ");
    throw new Error(
      `Workflow has multiple entry points: ${rootNodeLabels}. Specify 'entryNodeId' to select one.`,
    );
  }

  // Calculate executable nodes from start nodes.
  // A node is executable when at least one predecessor is already executable
  // (a merge may run from a single selected entry). The in-degree adjustment
  // below then ignores predecessors that will not run.
  const predecessors = new Map<string, Set<string>>();
  for (const node of nodes) {
    predecessors.set(node.id, new Set());
  }
  for (const conn of connections) {
    predecessors.get(conn.toNodeId)?.add(conn.fromNodeId);
  }

  const executableNodes = new Set<string>(startNodes);
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of nodes) {
      if (executableNodes.has(node.id)) continue;

      const preds = predecessors.get(node.id) || new Set();
      if (preds.size === 0) continue; // No predecessors and not a start node

      // Check if AT LEAST ONE predecessor is executable
      // This allows "merge" nodes to run when triggered from any entry path
      let anyPredExecutable = false;
      for (const pred of preds) {
        if (executableNodes.has(pred)) {
          anyPredExecutable = true;
          break;
        }
      }

      if (anyPredExecutable) {
        executableNodes.add(node.id);
        changed = true;
      }
    }
  }

  // Adjust in-degree to only count edges from executable predecessors
  // This ensures the BFS will properly trigger nodes that have some non-executable predecessors
  for (const node of nodes) {
    if (!executableNodes.has(node.id)) continue;
    const preds = predecessors.get(node.id) || new Set();
    let executablePredCount = 0;
    for (const pred of preds) {
      if (executableNodes.has(pred)) {
        executablePredCount++;
      }
    }
    inDegree.set(node.id, executablePredCount);
  }

  return { inDegree, adjacencyList, nodeMap, startNodes };
}

export interface WalkState {
  inDegree: Map<string, number>;
  adjacencyList: Map<string, WorkflowConnection[]>;
  nodeMap: Map<string, WorkflowNode>;
  readyQueue: string[];
  executed: Set<string>;
  queued: Set<string>;
}

export function createWalk(prepared: PreparedExecution): WalkState {
  return {
    inDegree: prepared.inDegree,
    adjacencyList: prepared.adjacencyList,
    nodeMap: prepared.nodeMap,
    readyQueue: [...prepared.startNodes],
    executed: new Set<string>(),
    queued: new Set<string>(prepared.startNodes),
  };
}

/**
 * Pop the next node, rejecting cycles and unknown ids. Returns null when the
 * queue is empty.
 */
export function shiftReady(state: WalkState): WorkflowNode | null {
  const currentNodeId = state.readyQueue.shift();
  if (currentNodeId === undefined) {
    return null;
  }
  const node = state.nodeMap.get(currentNodeId);
  if (!node) {
    throw new Error(`Node ${currentNodeId} not found in node map`);
  }
  if (state.executed.has(currentNodeId)) {
    throw new Error(
      `Cycle detected: node ${currentNodeId} (${node.label}) is being executed multiple times`,
    );
  }
  state.executed.add(currentNodeId);
  return node;
}

/**
 * Condition nodes with a selected path only follow edges whose sourceHandle
 * equals that path. Every other node follows every outgoing edge.
 */
export function outgoingConnections(
  node: WorkflowNode,
  allSuccessorConnections: WorkflowConnection[],
  nodeOutput: unknown,
): WorkflowConnection[] {
  if (node.type !== "condition") {
    return allSuccessorConnections;
  }
  const conditionOutput =
    nodeOutput && typeof nodeOutput === "object"
      ? (nodeOutput as { path?: unknown })
      : undefined;
  const selectedPath = conditionOutput?.path;
  if (!selectedPath) {
    return allSuccessorConnections;
  }
  return allSuccessorConnections.filter((conn) => {
    if (!conn.sourceHandle) {
      throw new Error(
        `Condition node "${node.id}" has a connection without sourceHandle. All condition node connections must specify sourceHandle ('true' or 'false').`,
      );
    }
    return conn.sourceHandle === selectedPath;
  });
}

export function enqueueSuccessors(
  successorConnections: WorkflowConnection[],
  inDegree: Map<string, number>,
  readyQueue: string[],
  queued: Set<string>,
): void {
  for (const conn of successorConnections) {
    const successorId = conn.toNodeId;
    const newDegree = (inDegree.get(successorId) || 0) - 1;
    inDegree.set(successorId, newDegree);

    if (newDegree === 0) {
      readyQueue.push(successorId);
      queued.add(successorId);
    } else if (newDegree < 0) {
      throw new Error(`Invalid graph state: node ${successorId} has negative in-degree`);
    }
  }
}

export function unfinishedNodesMessage(
  nodes: WorkflowNode[],
  queued: Set<string>,
  executed: Set<string>,
): string | null {
  if (executed.size >= queued.size) {
    return null;
  }
  const unexecuted = nodes
    .filter((n) => queued.has(n.id) && !executed.has(n.id))
    .map((n) => `${n.label} (${n.id})`)
    .join(", ");
  return (
    `Workflow incomplete: ${queued.size - executed.size} nodes not executed: ${unexecuted}. ` +
    `This indicates either a cycle or disconnected nodes in the execution path.`
  );
}

export interface ReplayInput {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  inputData: Record<string, unknown>;
  entryNodeId?: string;
  /** Recorded `outputData[nodeId]` values. Entry nodes ignore this and use inputData. */
  outputs: Record<string, unknown>;
}

export interface ReplayResult {
  ok: boolean;
  error: string | null;
  order: string[];
  variables: Record<string, unknown>;
  substituted: Record<string, unknown>;
}

function substituteJson(value: unknown, variables: Record<string, unknown>): unknown {
  if (typeof value === "string") {
    return substituteVariables(value, variables);
  }
  if (Array.isArray(value)) {
    return value.map((item) => substituteJson(item, variables));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = substituteJson(child, variables);
    }
    return out;
  }
  return value;
}

function applyRecordedOutput(
  node: WorkflowNode,
  inputData: Record<string, unknown>,
  outputData: Record<string, unknown>,
  recorded: Record<string, unknown>,
): void {
  if (node.type === "entry") {
    if (node.entryType === "api" || node.entryType === "form" || node.entryType === "webhook") {
      outputData["userInput"] = inputData;
      if (inputData && typeof inputData === "object") {
        Object.assign(outputData, inputData);
      }
    }
    return;
  }
  if (Object.prototype.hasOwnProperty.call(recorded, node.id)) {
    outputData[node.id] = recorded[node.id];
  }
}

/**
 * Replay a workflow without side effects.
 *
 * Uses the same prepare/walk helpers as `executeWorkflow`. Recorded outputs
 * stand in for AI and integration results so condition routing and downstream
 * substitution can be compared with `zf-core`.
 */
export function replayWorkflow(input: ReplayInput): ReplayResult {
  const order: string[] = [];
  const variablesByNode: Record<string, unknown> = {};
  const substituted: Record<string, unknown> = {};

  try {
    const prepared = prepareExecution(input.nodes, input.connections, input.entryNodeId);
    const walk = createWalk(prepared);
    const outputData: Record<string, unknown> = {};
    const inputData = input.inputData ?? {};

    while (true) {
      const node = shiftReady(walk);
      if (!node) break;
      order.push(node.id);

      const parsed = JSON.parse(node.config || "{}") as unknown;
      const available = collectAvailableVariables(
        node.id,
        input.connections,
        input.nodes,
        inputData,
        outputData,
      );
      variablesByNode[node.id] = available;
      substituted[node.id] = substituteJson(parsed, available);

      applyRecordedOutput(node, inputData, outputData, input.outputs);

      const allSuccessorConnections = walk.adjacencyList.get(node.id) || [];
      const successorConnections = outgoingConnections(node, allSuccessorConnections, outputData[node.id]);
      enqueueSuccessors(successorConnections, walk.inDegree, walk.readyQueue, walk.queued);
    }

    const unfinished = unfinishedNodesMessage(input.nodes, walk.queued, walk.executed);
    if (unfinished) {
      throw new Error(unfinished);
    }

    return { ok: true, error: null, order, variables: variablesByNode, substituted };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: message,
      order,
      variables: variablesByNode,
      substituted,
    };
  }
}
