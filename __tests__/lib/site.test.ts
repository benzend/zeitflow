import {
  CANONICAL_MCP_URL,
  CANONICAL_SITE_ORIGIN,
  canonicalizeSiteOrigin,
  getCanonicalSiteOrigin,
} from "@/lib/site";

describe("canonical site origin", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("advertises the www MCP endpoint", () => {
    expect(CANONICAL_SITE_ORIGIN).toBe("https://www.zeitflow.io");
    expect(CANONICAL_MCP_URL).toBe("https://www.zeitflow.io/api/mcp");
  });

  it("rewrites the apex host that 307s to www", () => {
    expect(canonicalizeSiteOrigin("https://zeitflow.io")).toBe(
      "https://www.zeitflow.io"
    );
    expect(canonicalizeSiteOrigin("https://zeitflow.io/")).toBe(
      "https://www.zeitflow.io"
    );
    expect(canonicalizeSiteOrigin("https://zeitflow.io/api/mcp")).toBe(
      "https://www.zeitflow.io/api/mcp"
    );
  });

  it("leaves localhost and preview hosts alone", () => {
    expect(canonicalizeSiteOrigin("http://localhost:3000")).toBe(
      "http://localhost:3000"
    );
    expect(
      canonicalizeSiteOrigin("https://zeitflow-git-preview.vercel.app")
    ).toBe("https://zeitflow-git-preview.vercel.app");
  });

  it("rewrites an apex NEXT_PUBLIC_APP_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://zeitflow.io";
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NEXT_PUBLIC_URL;
    expect(getCanonicalSiteOrigin()).toBe("https://www.zeitflow.io");
  });

  it("falls back to www when no public URL is set", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NEXT_PUBLIC_URL;
    expect(getCanonicalSiteOrigin()).toBe("https://www.zeitflow.io");
  });
});
