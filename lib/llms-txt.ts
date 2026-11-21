import { getAllGuides } from "@/lib/guides";

/**
 * Plain-text summary for agents, following https://llmstxt.org/.
 * Links use the public site origin passed in (www in production).
 */
export function buildLlmsTxt(origin: string): string {
  const site = origin.replace(/\/$/, "");
  const guides = getAllGuides()
    .map(
      (guide) =>
        `- [${guide.title}](${site}/guides/${guide.slug}): ${guide.excerpt.replace(/\s+/g, " ").trim()}`
    )
    .join("\n");

  return `# ZeitFlow

> ZeitFlow is an open-source workflow automation platform. A published workflow becomes an MCP tool that AI agents can discover and run. Workflows can also be built in a visual editor and started from an API call, a webhook, or a form.

The source is AGPLv3 and lives at https://github.com/benzend/zeitflow. The hosted product is ${site}. AI models are reached through OpenRouter. Accounts sign in with email and password or Google OAuth.

## Product

- [Home](${site}/): What ZeitFlow does, how MCP exposure works, and the published plans
- [About](${site}/about): Product description, source repository, and who operates the service
- [Integrations](${site}/integrations): Built-in integrations such as email, Slack, SMS, Google Sheets, GitHub, Notion, Stripe, Shopify, Jira, and others
- [Pricing](${site}/pricing): Free ($0, 20 executions/hour), Pro ($9.99/month, 100/hour), and Business ($29.99/month, 1,000/hour)
- [Security](${site}/security): Encryption, sign-in, API tokens, webhook secrets, rate limits, and account deletion as implemented in the product
- [Release notes](${site}/release-notes): Recorded product changes
- [Blog](${site}/blog): Writing about the product

## Guides

- [Guides](${site}/guides): Index of the public guides
${guides}

## API

- [MCP endpoint](${site}/api/mcp): Streamable HTTP MCP server. Clients send \`Authorization: Bearer <api-token>\`.
- [@zeitflow/mcp on npm](https://www.npmjs.com/package/@zeitflow/mcp): stdio package for MCP clients that cannot use the remote URL
- [@zeitflow/cli on npm](https://www.npmjs.com/package/@zeitflow/cli): Terminal client for workflows, executions, templates, and auth

## Policies

- [Privacy policy](${site}/privacy): Data the service collects, sub-processors, retention, and the published incident-notification commitment
- [Terms of service](${site}/terms): Rules for using the service, including that customer content is not used to train models
- [Contact](${site}/contact): support@zeitflow.io, privacy@zeitflow.io, and legal@zeitflow.io
- [Report content](${site}/report): Form for copyright and other legal reports
`;
}
