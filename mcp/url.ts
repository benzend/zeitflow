/**
 * Keep in sync with cli-npm/url.ts. The two packages publish separately, so
 * this copy cannot import the CLI module. __tests__/cli/canonicalize-base-url.test.ts
 * checks that both functions return the same value.
 */
export function canonicalizeBaseUrl(url: string): string {
  const trimmed = url.replace(/\/$/, "");
  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname === "zeitflow.io") {
      parsed.hostname = "www.zeitflow.io";
      return parsed.toString().replace(/\/$/, "");
    }
  } catch {
    return trimmed;
  }
  return trimmed;
}
