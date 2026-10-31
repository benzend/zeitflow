import { canonicalizeBaseUrl } from "../../cli-npm/url";

describe("canonicalizeBaseUrl", () => {
  it("rewrites the apex host to www", () => {
    expect(canonicalizeBaseUrl("https://zeitflow.io")).toBe(
      "https://www.zeitflow.io"
    );
    expect(canonicalizeBaseUrl("https://zeitflow.io/")).toBe(
      "https://www.zeitflow.io"
    );
    expect(canonicalizeBaseUrl("https://zeitflow.io/api/mcp")).toBe(
      "https://www.zeitflow.io/api/mcp"
    );
  });

  it("leaves www, localhost, and other hosts unchanged", () => {
    expect(canonicalizeBaseUrl("https://www.zeitflow.io")).toBe(
      "https://www.zeitflow.io"
    );
    expect(canonicalizeBaseUrl("http://localhost:3000/")).toBe(
      "http://localhost:3000"
    );
    expect(canonicalizeBaseUrl("https://preview.example.com")).toBe(
      "https://preview.example.com"
    );
  });

  it("returns an unparseable value trimmed instead of substituting www", () => {
    expect(canonicalizeBaseUrl("not a url")).toBe("not a url");
    expect(canonicalizeBaseUrl("not a url/")).toBe("not a url");
  });
});
