#!/usr/bin/env tsx
/**
 * ZeitFlow MCP Server
 *
 * Exposes workflow management tools via the Model Context Protocol,
 * allowing AI agents to create, configure, and execute workflows.
 *
 * Authentication: Set ZEITFLOW_API_TOKEN env var to a user's API token.
 * The server resolves the user from this token on startup.
 *
 * Usage:
 *   ZEITFLOW_API_TOKEN=<token> DATABASE_URL=<url> pnpm mcp
 *
 * Or add to your MCP client config (e.g. Claude Desktop):
 *   {
 *     "mcpServers": {
 *       "zeitflow": {
 *         "command": "pnpm",
 *         "args": ["mcp"],
 *         "env": {
 *           "ZEITFLOW_API_TOKEN": "<your-api-token>",
 *           "DATABASE_URL": "<your-database-url>"
 *         }
 *       }
 *     }
 *   }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc, and } from "drizzle-orm";
import {
  usersTable,
  workflowsTable,
  workflowNodesTable,
  workflowConnectionsTable,
  workflowExecutionsTable,
} from "../schema.js";
import { NODE_CONFIGS, NODE_TYPES } from "../lib/node-registry.js";
import { AI_MODELS } from "../lib/constants.js";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Database & Auth
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const API_TOKEN = process.env.ZEITFLOW_API_TOKEN;
if (!API_TOKEN) {
  console.error("ZEITFLOW_API_TOKEN environment variable is required");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

/** Resolve the authenticated user once at startup */
async function resolveUser(): Promise<{ id: string; email: string }> {
  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.apiToken, API_TOKEN!))
    .limit(1);

  if (!user) {
    console.error("Invalid ZEITFLOW_API_TOKEN – no matching user found");
    process.exit(1);
  }
  return user;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateNodeId(): string {
  return crypto.randomUUID();
}

const NODE_TYPE_ENUM = [
  "entry",
  "ai",
  "scheduler",
  "review",
  "email",
  "slack",
  "sms",
  "telegram",
  "condition",
  "youtube",
] as const;

type NodeType = (typeof NODE_TYPE_ENUM)[number];

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "zeitflow",
  version: "1.0.0",
});

// We'll set this after resolving the user
let currentUser: { id: string; email: string };

// ========================== DISCOVERY TOOLS ==========================

server.tool(
  "list_node_types",
  "List all available workflow node types with their default configurations",
  {},
  async () => {
    const nodeTypes = NODE_TYPES.map((type) => {
      const config = NODE_CONFIGS[type];
      return {
        type,
        hasConfig: config.configKey !== null,
        configKey: config.configKey,
        defaultConfig: config.defaultConfig,
      };
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(nodeTypes, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "list_ai_models",
  "List all available AI models for use in AI nodes",
  {},
  async () => {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(AI_MODELS, null, 2),
        },
      ],
    };
  }
);

// ========================== WORKFLOW CRUD ==========================

server.tool(
  "list_workflows",
  "List all workflows for the authenticated user",
  {
    status: z
      .enum(["draft", "published", "archived"])
      .optional()
      .describe("Filter by workflow status"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Max results to return (default 50)"),
  },
  async ({ status, limit }) => {
    const maxResults = limit ?? 50;

    const baseCondition = eq(workflowsTable.userId, currentUser.id);
    const whereClause = status
      ? and(baseCondition, eq(workflowsTable.status, status))
      : baseCondition;

    const workflows = await db
      .select({
        id: workflowsTable.id,
        name: workflowsTable.name,
        description: workflowsTable.description,
        status: workflowsTable.status,
        createdAt: workflowsTable.createdAt,
        updatedAt: workflowsTable.updatedAt,
      })
      .from(workflowsTable)
      .where(whereClause)
      .orderBy(desc(workflowsTable.updatedAt))
      .limit(maxResults);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(workflows, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "create_workflow",
  "Create a new workflow. Returns the workflow ID. An entry node is automatically added.",
  {
    name: z.string().min(1).describe("Workflow name"),
    description: z.string().optional().describe("Workflow description"),
    entryType: z
      .enum(["api", "form", "webhook"])
      .optional()
      .describe("Entry node type (default: api)"),
  },
  async ({ name, description, entryType }) => {
    const [workflow] = await db
      .insert(workflowsTable)
      .values({
        userId: currentUser.id,
        name,
        description: description ?? null,
        status: "draft",
        updatedAt: new Date(),
      })
      .returning();

    // Create a default entry node
    const entryNodeId = generateNodeId();
    await db.insert(workflowNodesTable).values({
      id: entryNodeId,
      workflowId: workflow.id,
      type: "entry",
      positionX: 250,
      positionY: 50,
      label: "Entry",
      entryType: entryType ?? "api",
      config: JSON.stringify({ fields: [] }),
      updatedAt: new Date(),
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              workflowId: workflow.id,
              entryNodeId,
              name: workflow.name,
              status: workflow.status,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "get_workflow",
  "Get a workflow's full details including all nodes and connections",
  {
    workflowId: z.number().int().describe("Workflow ID"),
  },
  async ({ workflowId }) => {
    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(
        and(
          eq(workflowsTable.id, workflowId),
          eq(workflowsTable.userId, currentUser.id)
        )
      )
      .limit(1);

    if (!workflow) {
      return {
        content: [
          { type: "text" as const, text: "Workflow not found" },
        ],
        isError: true,
      };
    }

    const nodes = await db
      .select()
      .from(workflowNodesTable)
      .where(eq(workflowNodesTable.workflowId, workflowId));

    const connections = await db
      .select()
      .from(workflowConnectionsTable)
      .where(eq(workflowConnectionsTable.workflowId, workflowId));

    // Parse config JSON for readability
    const parsedNodes = nodes.map((node) => ({
      ...node,
      config: node.config ? JSON.parse(node.config) : null,
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { workflow, nodes: parsedNodes, connections },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "update_workflow",
  "Update a workflow's metadata (name, description, status)",
  {
    workflowId: z.number().int().describe("Workflow ID"),
    name: z.string().optional().describe("New name"),
    description: z.string().optional().describe("New description"),
    status: z
      .enum(["draft", "published", "archived"])
      .optional()
      .describe("New status"),
  },
  async ({ workflowId, name, description, status }) => {
    const [existing] = await db
      .select({ id: workflowsTable.id })
      .from(workflowsTable)
      .where(
        and(
          eq(workflowsTable.id, workflowId),
          eq(workflowsTable.userId, currentUser.id)
        )
      )
      .limit(1);

    if (!existing) {
      return {
        content: [
          { type: "text" as const, text: "Workflow not found" },
        ],
        isError: true,
      };
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;

    await db
      .update(workflowsTable)
      .set(updates)
      .where(eq(workflowsTable.id, workflowId));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: true, workflowId }),
        },
      ],
    };
  }
);

server.tool(
  "delete_workflow",
  "Delete a workflow and all its nodes, connections, and executions",
  {
    workflowId: z.number().int().describe("Workflow ID"),
  },
  async ({ workflowId }) => {
    const [existing] = await db
      .select({ id: workflowsTable.id })
      .from(workflowsTable)
      .where(
        and(
          eq(workflowsTable.id, workflowId),
          eq(workflowsTable.userId, currentUser.id)
        )
      )
      .limit(1);

    if (!existing) {
      return {
        content: [
          { type: "text" as const, text: "Workflow not found" },
        ],
        isError: true,
      };
    }

    await db
      .delete(workflowsTable)
      .where(eq(workflowsTable.id, workflowId));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: true, deleted: workflowId }),
        },
      ],
    };
  }
);

// ========================== NODE MANAGEMENT ==========================

server.tool(
  "add_node",
  "Add a node to a workflow. Returns the new node ID.",
  {
    workflowId: z.number().int().describe("Workflow ID"),
    type: z
      .enum(NODE_TYPE_ENUM)
      .describe("Node type"),
    label: z.string().min(1).describe("Display label for the node"),
    positionX: z
      .number()
      .int()
      .optional()
      .describe("X position on canvas (default: 250)"),
    positionY: z
      .number()
      .int()
      .optional()
      .describe("Y position on canvas (default: 200)"),
    config: z
      .record(z.string(), z.unknown())
      .optional()
      .describe(
        "Node configuration object. For AI nodes: {aiConfig: {model, systemPrompt, userPrompt, outputType}}. For email: {emailConfig: {to, subject, message}}. Etc."
      ),
    entryType: z
      .enum(["api", "form", "webhook"])
      .optional()
      .describe("Entry type (only for entry nodes)"),
    fields: z
      .array(
        z.object({
          id: z.string().optional(),
          key: z.string(),
          name: z.string(),
          type: z.string(),
          label: z.string().optional(),
        })
      )
      .optional()
      .describe("Fields for entry nodes"),
  },
  async ({ workflowId, type, label, positionX, positionY, config, entryType, fields }) => {
    // Verify workflow ownership
    const [workflow] = await db
      .select({ id: workflowsTable.id })
      .from(workflowsTable)
      .where(
        and(
          eq(workflowsTable.id, workflowId),
          eq(workflowsTable.userId, currentUser.id)
        )
      )
      .limit(1);

    if (!workflow) {
      return {
        content: [
          { type: "text" as const, text: "Workflow not found" },
        ],
        isError: true,
      };
    }

    const nodeId = generateNodeId();

    // Build config JSON
    let nodeConfig: Record<string, unknown> = {};
    if (type === "entry") {
      nodeConfig.fields = (fields ?? []).map((f) => ({
        ...f,
        id: f.id ?? generateNodeId(),
      }));
    } else if (config) {
      nodeConfig = config;
    } else {
      // Use default config from registry
      const registryConfig = NODE_CONFIGS[type as keyof typeof NODE_CONFIGS];
      if (registryConfig.configKey && registryConfig.defaultConfig) {
        nodeConfig[registryConfig.configKey] = JSON.parse(
          JSON.stringify(registryConfig.defaultConfig)
        );
      }
    }

    await db.insert(workflowNodesTable).values({
      id: nodeId,
      workflowId,
      type,
      positionX: positionX ?? 250,
      positionY: positionY ?? 200,
      label,
      entryType: type === "entry" ? (entryType ?? "api") : null,
      config: JSON.stringify(nodeConfig),
      updatedAt: new Date(),
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ nodeId, type, label, workflowId }, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "update_node",
  "Update a node's label, position, or configuration",
  {
    nodeId: z.string().describe("Node ID"),
    label: z.string().optional().describe("New label"),
    positionX: z.number().int().optional().describe("New X position"),
    positionY: z.number().int().optional().describe("New Y position"),
    config: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("New configuration object (replaces existing config)"),
    entryType: z
      .enum(["api", "form", "webhook"])
      .optional()
      .describe("New entry type (only for entry nodes)"),
  },
  async ({ nodeId, label, positionX, positionY, config, entryType }) => {
    // Verify node exists and belongs to user's workflow
    const [node] = await db
      .select({
        id: workflowNodesTable.id,
        workflowId: workflowNodesTable.workflowId,
      })
      .from(workflowNodesTable)
      .innerJoin(
        workflowsTable,
        eq(workflowNodesTable.workflowId, workflowsTable.id)
      )
      .where(
        and(
          eq(workflowNodesTable.id, nodeId),
          eq(workflowsTable.userId, currentUser.id)
        )
      )
      .limit(1);

    if (!node) {
      return {
        content: [
          { type: "text" as const, text: "Node not found" },
        ],
        isError: true,
      };
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (label !== undefined) updates.label = label;
    if (positionX !== undefined) updates.positionX = positionX;
    if (positionY !== undefined) updates.positionY = positionY;
    if (config !== undefined) updates.config = JSON.stringify(config);
    if (entryType !== undefined) updates.entryType = entryType;

    await db
      .update(workflowNodesTable)
      .set(updates)
      .where(eq(workflowNodesTable.id, nodeId));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: true, nodeId }),
        },
      ],
    };
  }
);

server.tool(
  "remove_node",
  "Remove a node and all its connections from a workflow",
  {
    nodeId: z.string().describe("Node ID to remove"),
  },
  async ({ nodeId }) => {
    // Verify ownership
    const [node] = await db
      .select({
        id: workflowNodesTable.id,
      })
      .from(workflowNodesTable)
      .innerJoin(
        workflowsTable,
        eq(workflowNodesTable.workflowId, workflowsTable.id)
      )
      .where(
        and(
          eq(workflowNodesTable.id, nodeId),
          eq(workflowsTable.userId, currentUser.id)
        )
      )
      .limit(1);

    if (!node) {
      return {
        content: [
          { type: "text" as const, text: "Node not found" },
        ],
        isError: true,
      };
    }

    // Cascade delete handles connections
    await db
      .delete(workflowNodesTable)
      .where(eq(workflowNodesTable.id, nodeId));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: true, deleted: nodeId }),
        },
      ],
    };
  }
);

// ========================== CONNECTION MANAGEMENT ==========================

server.tool(
  "connect_nodes",
  "Create a connection between two nodes. For condition nodes, use sourceHandle ('true'/'false') to specify the branch.",
  {
    workflowId: z.number().int().describe("Workflow ID"),
    fromNodeId: z.string().describe("Source node ID"),
    toNodeId: z.string().describe("Target node ID"),
    sourceHandle: z
      .string()
      .optional()
      .describe(
        "Source handle for condition nodes ('true' or 'false')"
      ),
    targetHandle: z
      .string()
      .optional()
      .describe("Target handle"),
  },
  async ({ workflowId, fromNodeId, toNodeId, sourceHandle, targetHandle }) => {
    // Verify workflow ownership
    const [workflow] = await db
      .select({ id: workflowsTable.id })
      .from(workflowsTable)
      .where(
        and(
          eq(workflowsTable.id, workflowId),
          eq(workflowsTable.userId, currentUser.id)
        )
      )
      .limit(1);

    if (!workflow) {
      return {
        content: [
          { type: "text" as const, text: "Workflow not found" },
        ],
        isError: true,
      };
    }

    // Verify both nodes exist in this workflow
    const nodes = await db
      .select({ id: workflowNodesTable.id })
      .from(workflowNodesTable)
      .where(eq(workflowNodesTable.workflowId, workflowId));

    const nodeIds = new Set(nodes.map((n) => n.id));
    if (!nodeIds.has(fromNodeId)) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Source node ${fromNodeId} not found in workflow ${workflowId}`,
          },
        ],
        isError: true,
      };
    }
    if (!nodeIds.has(toNodeId)) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Target node ${toNodeId} not found in workflow ${workflowId}`,
          },
        ],
        isError: true,
      };
    }

    const [connection] = await db
      .insert(workflowConnectionsTable)
      .values({
        workflowId,
        fromNodeId,
        toNodeId,
        sourceHandle: sourceHandle ?? null,
        targetHandle: targetHandle ?? null,
      })
      .returning();

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              connectionId: connection.id,
              fromNodeId,
              toNodeId,
              sourceHandle: sourceHandle ?? null,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "remove_connection",
  "Remove a connection between two nodes",
  {
    connectionId: z.number().int().describe("Connection ID"),
  },
  async ({ connectionId }) => {
    // Verify ownership via join
    const [conn] = await db
      .select({ id: workflowConnectionsTable.id })
      .from(workflowConnectionsTable)
      .innerJoin(
        workflowsTable,
        eq(workflowConnectionsTable.workflowId, workflowsTable.id)
      )
      .where(
        and(
          eq(workflowConnectionsTable.id, connectionId),
          eq(workflowsTable.userId, currentUser.id)
        )
      )
      .limit(1);

    if (!conn) {
      return {
        content: [
          { type: "text" as const, text: "Connection not found" },
        ],
        isError: true,
      };
    }

    await db
      .delete(workflowConnectionsTable)
      .where(eq(workflowConnectionsTable.id, connectionId));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: true, deleted: connectionId }),
        },
      ],
    };
  }
);

// ========================== EXECUTION ==========================

server.tool(
  "execute_workflow",
  "Execute a workflow. The workflow must have at least one node. Returns the execution ID and output data.",
  {
    workflowId: z.number().int().describe("Workflow ID"),
    inputData: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("Input data for entry nodes (key-value pairs matching field keys)"),
    entryNodeId: z
      .string()
      .optional()
      .describe(
        "Specific entry node ID to start from (required if workflow has multiple entry points)"
      ),
  },
  async ({ workflowId, inputData, entryNodeId }) => {
    // Verify workflow ownership
    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(
        and(
          eq(workflowsTable.id, workflowId),
          eq(workflowsTable.userId, currentUser.id)
        )
      )
      .limit(1);

    if (!workflow) {
      return {
        content: [
          { type: "text" as const, text: "Workflow not found" },
        ],
        isError: true,
      };
    }

    // Use the existing execution API via HTTP to leverage the full execution engine
    // We need to find the host URL
    const host = process.env.HOST || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const url = `${host}/api/workflow/${workflowId}/execute`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({
          inputData: inputData ?? {},
          entryNodeId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { error: result.error || "Execution failed", status: response.status },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: `Failed to reach execution endpoint at ${url}. Make sure the ZeitFlow app is running.`,
              details: error instanceof Error ? error.message : String(error),
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_execution",
  "Get the details and logs of a workflow execution",
  {
    executionId: z.number().int().describe("Execution ID"),
  },
  async ({ executionId }) => {
    const [execution] = await db
      .select()
      .from(workflowExecutionsTable)
      .where(
        and(
          eq(workflowExecutionsTable.id, executionId),
          eq(workflowExecutionsTable.userId, currentUser.id)
        )
      )
      .limit(1);

    if (!execution) {
      return {
        content: [
          { type: "text" as const, text: "Execution not found" },
        ],
        isError: true,
      };
    }

    const parsed = {
      ...execution,
      inputData: execution.inputData ? JSON.parse(execution.inputData) : null,
      outputData: execution.outputData
        ? JSON.parse(execution.outputData)
        : null,
      logs: execution.logs ? JSON.parse(execution.logs) : [],
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(parsed, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "list_executions",
  "List recent executions for a workflow",
  {
    workflowId: z.number().int().describe("Workflow ID"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Max results (default 10)"),
    status: z
      .enum(["pending", "running", "completed", "failed"])
      .optional()
      .describe("Filter by execution status"),
  },
  async ({ workflowId, limit, status }) => {
    const maxResults = limit ?? 10;

    const baseCondition = and(
      eq(workflowExecutionsTable.workflowId, workflowId),
      eq(workflowExecutionsTable.userId, currentUser.id)
    );
    const whereClause = status
      ? and(baseCondition, eq(workflowExecutionsTable.status, status))
      : baseCondition;

    const executions = await db
      .select({
        id: workflowExecutionsTable.id,
        status: workflowExecutionsTable.status,
        error: workflowExecutionsTable.error,
        startedAt: workflowExecutionsTable.startedAt,
        completedAt: workflowExecutionsTable.completedAt,
      })
      .from(workflowExecutionsTable)
      .where(whereClause)
      .orderBy(desc(workflowExecutionsTable.startedAt))
      .limit(maxResults);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(executions, null, 2),
        },
      ],
    };
  }
);

// ========================== BULK WORKFLOW CREATION ==========================

server.tool(
  "create_workflow_from_template",
  `Create a complete workflow from a structured template in one call.
This is the most efficient way to build a workflow — specify all nodes and connections at once.
Each node in the 'nodes' array gets a temporary ID (e.g. "node_1", "node_2") that you reference in the 'connections' array.
The server maps these to real UUIDs.`,
  {
    name: z.string().min(1).describe("Workflow name"),
    description: z.string().optional().describe("Workflow description"),
    nodes: z
      .array(
        z.object({
          tempId: z
            .string()
            .describe(
              "Temporary ID to reference this node in connections (e.g. 'node_1')"
            ),
          type: z.enum(NODE_TYPE_ENUM).describe("Node type"),
          label: z.string().describe("Display label"),
          positionX: z.number().int().optional().describe("X position (default: auto)"),
          positionY: z.number().int().optional().describe("Y position (default: auto)"),
          entryType: z
            .enum(["api", "form", "webhook"])
            .optional()
            .describe("Entry type (only for entry nodes)"),
          fields: z
            .array(
              z.object({
                key: z.string(),
                name: z.string(),
                type: z.string(),
                label: z.string().optional(),
              })
            )
            .optional()
            .describe("Fields for entry nodes"),
          config: z
            .record(z.string(), z.unknown())
            .optional()
            .describe(
              "Node config object. Use the appropriate config key: aiConfig, emailConfig, slackConfig, smsConfig, telegramConfig, conditionConfig, youtubeConfig, schedulerConfig, reviewConfig"
            ),
        })
      )
      .min(1)
      .describe("Array of nodes to create"),
    connections: z
      .array(
        z.object({
          from: z.string().describe("Source node tempId"),
          to: z.string().describe("Target node tempId"),
          sourceHandle: z
            .string()
            .optional()
            .describe("Source handle for condition nodes ('true' or 'false')"),
        })
      )
      .optional()
      .describe("Array of connections between nodes (using tempIds)"),
  },
  async ({ name, description, nodes, connections }) => {
    // Create workflow
    const [workflow] = await db
      .insert(workflowsTable)
      .values({
        userId: currentUser.id,
        name,
        description: description ?? null,
        status: "draft",
        updatedAt: new Date(),
      })
      .returning();

    // Map tempIds to real UUIDs
    const idMap = new Map<string, string>();
    const createdNodes: Array<{ tempId: string; nodeId: string; type: string; label: string }> = [];

    // Auto-position nodes in a vertical flow if positions not specified
    let autoY = 50;

    for (const nodeDef of nodes) {
      const nodeId = generateNodeId();
      idMap.set(nodeDef.tempId, nodeId);

      // Build config
      let nodeConfig: Record<string, unknown> = {};
      if (nodeDef.type === "entry") {
        nodeConfig.fields = (nodeDef.fields ?? []).map((f) => ({
          ...f,
          id: generateNodeId(),
        }));
      } else if (nodeDef.config) {
        nodeConfig = nodeDef.config;
      } else {
        const registryConfig =
          NODE_CONFIGS[nodeDef.type as keyof typeof NODE_CONFIGS];
        if (registryConfig.configKey && registryConfig.defaultConfig) {
          nodeConfig[registryConfig.configKey] = JSON.parse(
            JSON.stringify(registryConfig.defaultConfig)
          );
        }
      }

      const posX = nodeDef.positionX ?? 250;
      const posY = nodeDef.positionY ?? autoY;
      autoY = posY + 150;

      await db.insert(workflowNodesTable).values({
        id: nodeId,
        workflowId: workflow.id,
        type: nodeDef.type,
        positionX: posX,
        positionY: posY,
        label: nodeDef.label,
        entryType: nodeDef.type === "entry" ? (nodeDef.entryType ?? "api") : null,
        config: JSON.stringify(nodeConfig),
        updatedAt: new Date(),
      });

      createdNodes.push({
        tempId: nodeDef.tempId,
        nodeId,
        type: nodeDef.type,
        label: nodeDef.label,
      });
    }

    // Create connections
    const createdConnections: Array<{
      from: string;
      to: string;
      fromNodeId: string;
      toNodeId: string;
    }> = [];

    if (connections) {
      for (const conn of connections) {
        const fromNodeId = idMap.get(conn.from);
        const toNodeId = idMap.get(conn.to);

        if (!fromNodeId || !toNodeId) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Invalid connection: "${conn.from}" -> "${conn.to}". ` +
                  `Could not resolve tempId. Available: ${Array.from(idMap.keys()).join(", ")}`,
              },
            ],
            isError: true,
          };
        }

        await db.insert(workflowConnectionsTable).values({
          workflowId: workflow.id,
          fromNodeId,
          toNodeId,
          sourceHandle: conn.sourceHandle ?? null,
          targetHandle: null,
        });

        createdConnections.push({
          from: conn.from,
          to: conn.to,
          fromNodeId,
          toNodeId,
        });
      }
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              workflowId: workflow.id,
              name: workflow.name,
              status: workflow.status,
              nodes: createdNodes,
              connections: createdConnections,
              idMap: Object.fromEntries(idMap),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
  currentUser = await resolveUser();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so it doesn't interfere with MCP stdio protocol
  console.error(
    `ZeitFlow MCP server running (user: ${currentUser.email})`
  );
}

main().catch((err) => {
  console.error("Fatal error starting MCP server:", err);
  process.exit(1);
});
