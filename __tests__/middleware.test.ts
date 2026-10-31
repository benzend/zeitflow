/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { middleware } from "../middleware";

describe("well-known middleware", () => {
  it("serves OAuth discovery paths without an auth challenge", async () => {
    const response = middleware(
      new NextRequest(
        "https://www.zeitflow.io/.well-known/oauth-protected-resource"
      )
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("www-authenticate")).toBeNull();
    expect(response.headers.get("cache-control")).toContain("public");
    expect(response.headers.get("content-type")).toContain("application/json");

    const body = await response.json();
    expect(body.error).toBe("oauth_not_supported");
    expect(body.issuer).toBeUndefined();
    expect(body.authorization_servers).toBeUndefined();
  });

  it("serves the authorization-server path the same way", async () => {
    const response = middleware(
      new NextRequest(
        "https://zeitflow.io/.well-known/oauth-authorization-server"
      )
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("oauth_not_supported");
  });
});
