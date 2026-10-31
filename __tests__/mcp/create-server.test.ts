/**
 * Tests for mcp/create-server.ts — MCP server factory
 */

// Mock external dependencies
jest.mock("@modelcontextprotocol/sdk/server/mcp.js", () => {
  const registerToolMock = jest.fn();
  return {
    McpServer: jest.fn(() => ({
      registerTool: registerToolMock,
      _registerToolMock: registerToolMock,
    })),
  };
});

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  desc: jest.fn(),
  and: jest.fn(),
}));

jest.mock("@/schema", () => ({
  usersTable: {},
  workflowsTable: {},
  workflowNodesTable: {},
  workflowConnectionsTable: {},
  workflowExecutionsTable: {},
}));

jest.mock("@/lib/node-registry", () => ({
  NODE_TYPES: ["entry", "ai", "email", "slack", "sms"],
  NODE_CONFIGS: {
    entry: { configKey: null, defaultConfig: null },
    ai: {
      configKey: "aiConfig",
      defaultConfig: { model: "test", systemPrompt: "", userPrompt: "" },
    },
    email: {
      configKey: "emailConfig",
      defaultConfig: { to: [], subject: "", message: "" },
    },
    slack: {
      configKey: "slackConfig",
      defaultConfig: { channel: "", message: "" },
    },
    sms: {
      configKey: "smsConfig",
      defaultConfig: { to: [], message: "" },
    },
  },
}));

jest.mock("@/lib/constants", () => ({
  AI_MODELS: [{ id: "test-model", name: "Test Model" }],
}));

import { createMcpServer } from "@/mcp/create-server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

describe("createMcpServer", () => {
  const mockDb = {} as any;
  const mockUser = { id: "user-1", email: "test@test.com" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an McpServer instance", () => {
    const server = createMcpServer(mockDb, mockUser);
    expect(server).toBeDefined();
    expect(McpServer).toHaveBeenCalledWith({
      name: "zeitflow",
      version: "1.0.0",
    });
  });

  it("registers all 16 MCP tools", () => {
    const server = createMcpServer(mockDb, mockUser);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registerToolMock = (server as any)._registerToolMock;

    expect(registerToolMock).toHaveBeenCalledTimes(16);
  });

  it("registers the expected tool names", () => {
    const server = createMcpServer(mockDb, mockUser);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registerToolMock = (server as any)._registerToolMock;

    const registeredNames = registerToolMock.mock.calls.map(
      (call: unknown[]) => call[0]
    );

    expect(registeredNames).toContain("list_node_types");
    expect(registeredNames).toContain("list_ai_models");
    expect(registeredNames).toContain("create_workflow");
    expect(registeredNames).toContain("get_workflow");
    expect(registeredNames).toContain("list_workflows");
    expect(registeredNames).toContain("update_workflow");
    expect(registeredNames).toContain("delete_workflow");
    expect(registeredNames).toContain("add_node");
    expect(registeredNames).toContain("update_node");
    expect(registeredNames).toContain("remove_node");
    expect(registeredNames).toContain("connect_nodes");
    expect(registeredNames).toContain("remove_connection");
    expect(registeredNames).toContain("execute_workflow");
    expect(registeredNames).toContain("get_execution");
    expect(registeredNames).toContain("list_executions");
    expect(registeredNames).toContain("create_workflow_from_template");
  });

  it("sets a title and read/destructive hints on every tool", () => {
    const server = createMcpServer(mockDb, mockUser);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registerToolMock = (server as any)._registerToolMock;

    const expectedHints: Record<
      string,
      { readOnlyHint: boolean; destructiveHint: boolean }
    > = {
      list_node_types: { readOnlyHint: true, destructiveHint: false },
      list_ai_models: { readOnlyHint: true, destructiveHint: false },
      list_workflows: { readOnlyHint: true, destructiveHint: false },
      get_workflow: { readOnlyHint: true, destructiveHint: false },
      get_execution: { readOnlyHint: true, destructiveHint: false },
      list_executions: { readOnlyHint: true, destructiveHint: false },
      create_workflow: { readOnlyHint: false, destructiveHint: false },
      add_node: { readOnlyHint: false, destructiveHint: false },
      connect_nodes: { readOnlyHint: false, destructiveHint: false },
      create_workflow_from_template: {
        readOnlyHint: false,
        destructiveHint: false,
      },
      update_workflow: { readOnlyHint: false, destructiveHint: true },
      update_node: { readOnlyHint: false, destructiveHint: true },
      delete_workflow: { readOnlyHint: false, destructiveHint: true },
      remove_node: { readOnlyHint: false, destructiveHint: true },
      remove_connection: { readOnlyHint: false, destructiveHint: true },
      execute_workflow: { readOnlyHint: false, destructiveHint: true },
    };

    const registered = new Map<string, {
      title?: string;
      annotations?: {
        title?: string;
        readOnlyHint?: boolean;
        destructiveHint?: boolean;
      };
    }>();

    for (const call of registerToolMock.mock.calls as unknown[][]) {
      registered.set(call[0] as string, call[1] as {
        title?: string;
        annotations?: {
          title?: string;
          readOnlyHint?: boolean;
          destructiveHint?: boolean;
        };
      });
    }

    expect([...registered.keys()].sort()).toEqual(
      Object.keys(expectedHints).sort()
    );

    for (const [name, hints] of Object.entries(expectedHints)) {
      const config = registered.get(name);
      expect(config?.title).toEqual(expect.any(String));
      expect(config?.title?.length).toBeGreaterThan(0);
      expect(config?.annotations).toEqual({
        title: config?.title,
        readOnlyHint: hints.readOnlyHint,
        destructiveHint: hints.destructiveHint,
      });
    }
  });

  it("uses provided host option for execute_workflow", () => {
    createMcpServer(mockDb, mockUser, {
      host: "https://custom.host.io",
      apiToken: "my-token",
    });

    // The host is captured in the closure — we verify it's accepted
    // without throwing. Functional testing of the execute tool is
    // covered by integration tests.
    expect(McpServer).toHaveBeenCalled();
  });

  it("accepts user with different ids", () => {
    const userA = { id: "aaa", email: "a@test.com" };
    const userB = { id: "bbb", email: "b@test.com" };

    const serverA = createMcpServer(mockDb, userA);
    const serverB = createMcpServer(mockDb, userB);

    // Both should produce valid servers
    expect(serverA).toBeDefined();
    expect(serverB).toBeDefined();
    expect(McpServer).toHaveBeenCalledTimes(2);
  });
});
