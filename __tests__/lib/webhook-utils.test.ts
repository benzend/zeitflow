import { buildWebhookUrl } from "@/lib/webhook-utils";

describe("buildWebhookUrl", () => {
  const originalHost = process.env.HOST;
  const originalAuthUrl = process.env.NEXTAUTH_URL;

  afterEach(() => {
    if (originalHost === undefined) delete process.env.HOST;
    else process.env.HOST = originalHost;
    if (originalAuthUrl === undefined) delete process.env.NEXTAUTH_URL;
    else process.env.NEXTAUTH_URL = originalAuthUrl;
  });

  it("rewrites an apex HOST so the internal POST does not follow the 307", () => {
    process.env.HOST = "https://zeitflow.io";
    delete process.env.NEXTAUTH_URL;
    expect(buildWebhookUrl(7, "abc")).toBe(
      "https://www.zeitflow.io/api/workflow/7/execute?secret=abc"
    );
  });
});
