import { getGuide } from "@/lib/guides";
import {
  PRIVATE_SITEMAP_PATHS,
  PUBLIC_STATIC_PATHS,
  isPublicSitemapPath,
  publicGuidePaths,
} from "@/lib/sitemap-entries";

describe("public sitemap paths", () => {
  it("excludes private app pages called out in the audit", () => {
    for (const path of [
      "/dashboard",
      "/settings",
      "/blog/create",
      "/blog/manage",
      "/test-workflow",
      "/workflows",
      "/assets",
    ]) {
      expect(isPublicSitemapPath(path)).toBe(false);
      expect(PUBLIC_STATIC_PATHS).not.toContain(path);
    }
  });

  it("keeps the private list and the public list disjoint", () => {
    for (const path of PRIVATE_SITEMAP_PATHS) {
      expect(PUBLIC_STATIC_PATHS).not.toContain(path);
    }
  });

  it("includes public marketing, docs, and auth entry pages", () => {
    expect(PUBLIC_STATIC_PATHS).toEqual(
      expect.arrayContaining([
        "",
        "/pricing",
        "/terms",
        "/privacy",
        "/release-notes",
        "/contact",
        "/blog",
        "/guides",
        "/integrations",
        "/auth/signin",
        "/auth/register",
      ])
    );
  });

  it("lists guide pages and not admin blog routes", () => {
    const guides = publicGuidePaths();
    expect(guides).toContain("/guides/mcp-server-setup");
    const setupGuide = getGuide("mcp-server-setup");
    expect(setupGuide?.content).toContain("https://www.zeitflow.io/api/mcp");
    expect(setupGuide?.content).not.toContain("https://zeitflow.io/api/mcp");
    expect(guides.every((path) => isPublicSitemapPath(path))).toBe(true);
    expect(isPublicSitemapPath("/blog/create")).toBe(false);
    expect(isPublicSitemapPath("/blog/some-public-post")).toBe(true);
  });
});
