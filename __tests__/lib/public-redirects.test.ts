import nextConfig from "../../next.config";

describe("public path redirects", () => {
  it("permanently redirects docs and changelog to the pages that exist", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toEqual(
      expect.arrayContaining([
        { source: "/docs", destination: "/guides", permanent: true },
        { source: "/changelog", destination: "/release-notes", permanent: true },
      ])
    );
  });
});
