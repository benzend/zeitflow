import {
  OAUTH_NOT_SUPPORTED_BODY,
  isOAuthDiscoveryPath,
  wellKnownDiscoveryBody,
} from "@/lib/well-known-oauth";

describe("OAuth discovery documents", () => {
  it.each([
    "/.well-known/oauth-protected-resource",
    "/.well-known/oauth-protected-resource/api/mcp",
    "/.well-known/oauth-authorization-server",
    "/.well-known/oauth-authorization-server/api/mcp",
  ])("treats %s as an OAuth discovery path", (pathname) => {
    expect(isOAuthDiscoveryPath(pathname)).toBe(true);
  });

  it("returns a public 404 that is not OAuth metadata", () => {
    const result = wellKnownDiscoveryBody(
      "/.well-known/oauth-protected-resource"
    );

    expect(result.status).toBe(404);
    expect(result.body).toEqual(OAUTH_NOT_SUPPORTED_BODY);
    expect(result.body).not.toHaveProperty("issuer");
    expect(result.body).not.toHaveProperty("authorization_endpoint");
    expect(result.body).not.toHaveProperty("token_endpoint");
    expect(result.body).not.toHaveProperty("authorization_servers");
    expect(result.body.error_description).toContain(
      "https://www.zeitflow.io/api/mcp"
    );
  });

  it("returns the same explanation for the authorization-server path", () => {
    expect(
      wellKnownDiscoveryBody("/.well-known/oauth-authorization-server").body
    ).toEqual(
      wellKnownDiscoveryBody("/.well-known/oauth-protected-resource").body
    );
  });

  it("does not require authentication for other well-known paths", () => {
    const result = wellKnownDiscoveryBody("/.well-known/openid-configuration");
    expect(result.status).toBe(404);
    expect(result.body.error).toBe("not_found");
    expect(JSON.stringify(result.body)).not.toMatch(/unauthorized/i);
  });
});
