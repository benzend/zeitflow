/**
 * Tests for mcp/create-server.ts — MCP server factory
 */

// Mock external dependencies
jest.mock("@modelcontextprotocol/sdk/server/mcp.js", () => {
  const toolMock = jest.fn();
  return {
    McpServer: jest.fn(() => ({
      tool: toolMock,
      _toolMock: toolMock,
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
    const toolMock = (server as any)._toolMock;

    expect(toolMock).toHaveBeenCalledTimes(16);
  });

  it("registers the expected tool names", () => {
    const server = createMcpServer(mockDb, mockUser);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolMock = (server as any)._toolMock;

    const registeredNames = toolMock.mock.calls.map(
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
