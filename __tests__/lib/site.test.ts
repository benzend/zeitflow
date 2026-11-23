import {
  CANONICAL_MCP_URL,
  CANONICAL_SITE_ORIGIN,
  canonicalizeInternalHost,
  canonicalizeSiteOrigin,
  getCanonicalSiteOrigin,
  getInternalOrigin,
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

  it("rewrites the apex host that 307s to www and returns the origin", () => {
    expect(canonicalizeSiteOrigin("https://zeitflow.io")).toBe(
      "https://www.zeitflow.io"
    );
    expect(canonicalizeSiteOrigin("https://zeitflow.io/")).toBe(
      "https://www.zeitflow.io"
    );
    expect(canonicalizeSiteOrigin("https://zeitflow.io/api/mcp")).toBe(
      "https://www.zeitflow.io"
    );
  });

  it("warns and falls back when the value is not a URL", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    expect(canonicalizeSiteOrigin("not a url")).toBe(CANONICAL_SITE_ORIGIN);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("leaves localhost and preview hosts alone", () => {
    expect(canonicalizeSiteOrigin("http://localhost:3000")).toBe(
      "http://localhost:3000"
    );
    expect(
      canonicalizeSiteOrigin("https://zeitflow-git-preview.vercel.app")
    ).toBe("https://zeitflow-git-preview.vercel.app");
  });

  it("rewrites an apex NEXT_PUBLIC_APP_URL and prefers it over the legacy vars", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://zeitflow.io";
    process.env.NEXT_PUBLIC_BASE_URL = "https://preview.example.com";
    process.env.NEXT_PUBLIC_URL = "http://localhost:3000";
    expect(getCanonicalSiteOrigin()).toBe("https://www.zeitflow.io");
  });

  it("uses NEXT_PUBLIC_URL when the other public URL vars are unset", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_BASE_URL;
    process.env.NEXT_PUBLIC_URL = "https://zeitflow.io";
    expect(getCanonicalSiteOrigin()).toBe("https://www.zeitflow.io");
  });

  it("falls back to www when no public URL is set", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NEXT_PUBLIC_URL;
    expect(getCanonicalSiteOrigin()).toBe("https://www.zeitflow.io");
  });
});

describe("internal host", () => {
  const originalHost = process.env.HOST;
  const originalAuthUrl = process.env.NEXTAUTH_URL;

  afterEach(() => {
    if (originalHost === undefined) delete process.env.HOST;
    else process.env.HOST = originalHost;
    if (originalAuthUrl === undefined) delete process.env.NEXTAUTH_URL;
    else process.env.NEXTAUTH_URL = originalAuthUrl;
  });

  it("rewrites only the apex host and keeps other hosts", () => {
    expect(canonicalizeInternalHost("https://zeitflow.io")).toBe(
      "https://www.zeitflow.io"
    );
    expect(canonicalizeInternalHost("https://zeitflow.io/")).toBe(
      "https://www.zeitflow.io"
    );
    expect(canonicalizeInternalHost("https://preview.example.com")).toBe(
      "https://preview.example.com"
    );
    expect(canonicalizeInternalHost("http://localhost:3000")).toBe(
      "http://localhost:3000"
    );
  });

  it("prefixes a scheme for a bare localhost value", () => {
    expect(canonicalizeInternalHost("localhost:3000")).toBe(
      "http://localhost:3000"
    );
  });

  it("does not replace an unparseable host with production", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    expect(canonicalizeInternalHost("not a url")).toBe("not a url");
    expect(canonicalizeInternalHost("")).toBe("");
    expect(warn).toHaveBeenCalled();
    expect(canonicalizeInternalHost("not a url")).not.toBe(CANONICAL_SITE_ORIGIN);
    warn.mockRestore();
  });

  it("reads HOST before NEXTAUTH_URL and returns undefined when both are unset", () => {
    process.env.HOST = "https://zeitflow.io";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    expect(getInternalOrigin()).toBe("https://www.zeitflow.io");

    delete process.env.HOST;
    process.env.NEXTAUTH_URL = "localhost:3000";
    expect(getInternalOrigin()).toBe("http://localhost:3000");

    delete process.env.NEXTAUTH_URL;
    expect(getInternalOrigin()).toBeUndefined();
  });
});
