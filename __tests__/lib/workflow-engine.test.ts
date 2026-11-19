import { replayWorkflow, substituteVariables } from "@/lib/workflow-engine";

describe("workflow engine replay", () => {
  it("walks entry then AI and substitutes the entry payload", () => {
    const result = replayWorkflow({
      nodes: [
        {
          id: "entry-1",
          type: "entry",
          label: "Support Ticket",
          entryType: "form",
          config: JSON.stringify({ fields: [{ key: "customer_name" }] }),
        },
        {
          id: "ai-1",
          type: "ai",
          label: "Summarize",
          config: JSON.stringify({
            aiConfig: { userPrompt: "Hello {{support_ticket.customer_name}}" },
          }),
        },
      ],
      connections: [{ id: "c1", fromNodeId: "entry-1", toNodeId: "ai-1" }],
      inputData: { customer_name: "Ada" },
      outputs: {},
    });

    expect(result.ok).toBe(true);
    expect(result.order).toEqual(["entry-1", "ai-1"]);
    expect(result.substituted["ai-1"]).toEqual({
      aiConfig: { userPrompt: "Hello Ada" },
    });
  });

  it("rejects a workflow with two roots when no entry is selected", () => {
    const result = replayWorkflow({
      nodes: [
        { id: "entry-a", type: "entry", label: "Entry A", entryType: "form" },
        { id: "entry-b", type: "entry", label: "Entry B", entryType: "api" },
      ],
      connections: [],
      inputData: {},
      outputs: {},
    });

    expect(result).toEqual({
      ok: false,
      error: "Workflow has multiple entry points: Entry A (entry-a), Entry B (entry-b). Specify 'entryNodeId' to select one.",
      order: [],
      variables: {},
      substituted: {},
    });
  });

  it("replaces a missing placeholder with an empty string", () => {
    expect(substituteVariables("Hello {{name}}", {})).toBe("Hello ");
  });
});
