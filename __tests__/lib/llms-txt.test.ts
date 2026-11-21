import { buildLlmsTxt } from "@/lib/llms-txt";

describe("llms.txt", () => {
  const body = buildLlmsTxt("https://www.zeitflow.io");

  it("follows the llmstxt heading shape and links the public pages", () => {
    expect(body.startsWith("# ZeitFlow\n\n> ")).toBe(true);
    expect(body).toContain("https://www.zeitflow.io/about");
    expect(body).toContain("https://www.zeitflow.io/security");
    expect(body).toContain("https://www.zeitflow.io/guides");
    expect(body).toContain("https://www.zeitflow.io/guides/mcp-server-setup");
    expect(body).toContain("https://www.zeitflow.io/guides/cli");
    expect(body).toContain("https://www.zeitflow.io/release-notes");
    expect(body).toContain("https://www.zeitflow.io/api/mcp");
    expect(body).not.toContain("https://zeitflow.io/");
    expect(body).not.toContain("/docs");
    expect(body).not.toContain("/changelog");
  });

  it("does not claim a certification", () => {
    expect(body.toLowerCase()).not.toContain("soc 2");
    expect(body.toLowerCase()).not.toContain("iso 27001");
    expect(body.toLowerCase()).not.toContain("certified");
  });
});
