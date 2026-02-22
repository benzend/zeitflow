/**
 * Tests for /api/mcp — Remote MCP endpoint
 */

// Mock dependencies before imports
const mockSelect = jest.fn();
const mockFrom = jest.fn();
const mockWhere = jest.fn();
const mockLimit = jest.fn();

jest.mock("@/lib/db", () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return {
        from: (...fArgs: unknown[]) => {
          mockFrom(...fArgs);
          return {
            where: (...wArgs: unknown[]) => {
              mockWhere(...wArgs);
              return {
                limit: (...lArgs: unknown[]) => mockLimit(...lArgs),
              };
            },
          };
        },
      };
    },
  },
}));

jest.mock("@/schema", () => ({
  usersTable: { apiToken: "apiToken" },
  workflowsTable: {},
  workflowNodesTable: {},
  workflowConnectionsTable: {},
  workflowExecutionsTable: {},
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  desc: jest.fn(),
  and: jest.fn(),
}));

// Mock the MCP server factory
const mockConnect = jest.fn();
const mockClose = jest.fn();
jest.mock("@/mcp/create-server", () => ({
  createMcpServer: jest.fn(() => ({
    connect: mockConnect,
    close: mockClose,
  })),
}));

// Mock the StreamableHTTPServerTransport
const mockHandleRequest = jest.fn();
const mockTransportClose = jest.fn();
jest.mock("@modelcontextprotocol/sdk/server/streamableHttp.js", () => ({
  StreamableHTTPServerTransport: jest.fn(() => ({
    handleRequest: mockHandleRequest,
    close: mockTransportClose,
  })),
}));

import { createRequest, createResponse } from "node-mocks-http";
import type { NextApiRequest, NextApiResponse } from "next";
import handler from "@/pages/api/mcp";
import { createMcpServer } from "@/mcp/create-server";

describe("/api/mcp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLimit.mockResolvedValue([]);
  });

  // ---------- Auth tests ----------

  it("returns 401 when no Authorization header is provided", async () => {
    const req = createRequest<NextApiRequest>({
      method: "POST",
      headers: {},
    });
    const res = createResponse<NextApiResponse>();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    const body = res._getJSONData();
    expect(body.error.code).toBe(-32001);
    expect(body.error.message).toMatch(/Missing or invalid Authorization/);
  });

  it("returns 401 when Authorization header is not Bearer", async () => {
    const req = createRequest<NextApiRequest>({
      method: "POST",
      headers: { authorization: "Basic abc123" },
    });
    const res = createResponse<NextApiResponse>();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    const body = res._getJSONData();
    expect(body.error.code).toBe(-32001);
  });

  it("returns 401 when token does not match any user", async () => {
    mockLimit.mockResolvedValue([]); // no user found

    const req = createRequest<NextApiRequest>({
      method: "POST",
      headers: { authorization: "Bearer invalid-token" },
    });
    const res = createResponse<NextApiResponse>();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    const body = res._getJSONData();
    expect(body.error.message).toMatch(/Invalid API token/);
  });

  // ---------- Method validation ----------

  it("returns 405 for GET requests", async () => {
    mockLimit.mockResolvedValue([{ id: "user-1", email: "test@test.com" }]);

    const req = createRequest<NextApiRequest>({
      method: "GET",
      headers: { authorization: "Bearer valid-token" },
    });
    const res = createResponse<NextApiResponse>();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    const body = res._getJSONData();
    expect(body.error.message).toMatch(/Method not allowed/);
  });

  it("returns 405 for DELETE requests", async () => {
    mockLimit.mockResolvedValue([{ id: "user-1", email: "test@test.com" }]);

    const req = createRequest<NextApiRequest>({
      method: "DELETE",
      headers: { authorization: "Bearer valid-token" },
    });
    const res = createResponse<NextApiResponse>();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
  });

  // ---------- Happy path ----------

  it("creates MCP server and transport for valid POST request", async () => {
    mockLimit.mockResolvedValue([{ id: "user-1", email: "test@test.com" }]);
    mockHandleRequest.mockResolvedValue(undefined);

    const req = createRequest<NextApiRequest>({
      method: "POST",
      headers: {
        authorization: "Bearer valid-token",
        host: "www.zeitflow.io",
      },
    });
    const res = createResponse<NextApiResponse>();

    await handler(req, res);

    // Should create the MCP server with the resolved user
    expect(createMcpServer).toHaveBeenCalledWith(
      expect.anything(), // db
      { id: "user-1", email: "test@test.com" },
      expect.objectContaining({ apiToken: "valid-token" })
    );

    // Should connect and handle the request
    expect(mockConnect).toHaveBeenCalled();
    expect(mockHandleRequest).toHaveBeenCalledWith(req, res);
  });

  it("cleans up server and transport after handling request", async () => {
    mockLimit.mockResolvedValue([{ id: "user-1", email: "test@test.com" }]);
    mockHandleRequest.mockResolvedValue(undefined);

    const req = createRequest<NextApiRequest>({
      method: "POST",
      headers: {
        authorization: "Bearer valid-token",
        host: "localhost:3000",
      },
    });
    const res = createResponse<NextApiResponse>();

    await handler(req, res);

    expect(mockTransportClose).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });

  it("returns 500 JSON-RPC error if transport throws", async () => {
    mockLimit.mockResolvedValue([{ id: "user-1", email: "test@test.com" }]);
    mockHandleRequest.mockRejectedValue(new Error("transport boom"));

    const req = createRequest<NextApiRequest>({
      method: "POST",
      headers: {
        authorization: "Bearer valid-token",
        host: "localhost:3000",
      },
    });
    const res = createResponse<NextApiResponse>();

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    const body = res._getJSONData();
    expect(body.error.code).toBe(-32603);
    expect(body.error.message).toBe("transport boom");
  });
});
