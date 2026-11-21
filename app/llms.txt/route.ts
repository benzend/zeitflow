import { buildLlmsTxt } from "@/lib/llms-txt";
import { getCanonicalSiteOrigin } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const body = buildLlmsTxt(getCanonicalSiteOrigin());

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
