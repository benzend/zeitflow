import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Button } from "@/components/Button";
import { CopyButton } from "@/components/CopyButton";
import ProfileDropdown from "@/components/ProfileDropdown";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Client =
  | "remote"
  | "claude-desktop"
  | "claude-code"
  | "cursor"
  | "vscode"
  | "windsurf"
  | "npm";

interface ClientMeta {
  id: Client;
  name: string;
  description: string;
}

const CLIENTS: ClientMeta[] = [
  {
    id: "remote",
    name: "Remote URL",
    description: "Any client that supports Streamable HTTP",
  },
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    description: "Anthropic's desktop app",
  },
  {
    id: "claude-code",
    name: "Claude Code",
    description: "Anthropic's CLI agent",
  },
  {
    id: "cursor",
    name: "Cursor",
    description: "AI-native code editor",
  },
  {
    id: "vscode",
    name: "VS Code",
    description: "GitHub Copilot MCP",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    description: "Codeium's AI editor",
  },
  {
    id: "npm",
    name: "npx (local)",
    description: "Run locally via npx",
  },
];

// ---------------------------------------------------------------------------
// Config generators
// ---------------------------------------------------------------------------

function getAppUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return "https://www.zeitflow.io";
}

function generateConfig(
  client: Client,
  token: string
): { config: string; filename?: string; deepLink?: string } {
  const url = getAppUrl();
  const placeholder = token || "YOUR_API_TOKEN";

  switch (client) {
    case "remote":
      return {
        config: JSON.stringify(
          {
            mcpServers: {
              zeitflow: {
                serverUrl: `${url}/api/mcp`,
                headers: {
                  Authorization: `Bearer ${placeholder}`,
                },
              },
            },
          },
          null,
          2
        ),
      };

    case "claude-desktop":
      return {
        config: JSON.stringify(
          {
            mcpServers: {
              zeitflow: {
                serverUrl: `${url}/api/mcp`,
                headers: {
                  Authorization: `Bearer ${placeholder}`,
                },
              },
            },
          },
          null,
          2
        ),
        filename:
          "~/Library/Application Support/Claude/claude_desktop_config.json",
      };

    case "claude-code": {
      const config = JSON.stringify(
        {
          mcpServers: {
            zeitflow: {
              serverUrl: `${url}/api/mcp`,
              headers: {
                Authorization: `Bearer ${placeholder}`,
              },
            },
          },
        },
        null,
        2
      );
      return {
        config,
        filename: ".mcp.json (project root) or ~/.claude.json (global)",
      };
    }

    case "cursor": {
      const cursorConfig = {
        serverUrl: `${url}/api/mcp`,
        headers: {
          Authorization: `Bearer ${placeholder}`,
        },
      };
      const deepLink = `cursor://anysphere.cursor-deeplink/mcp/install?name=ZeitFlow&config=${encodeURIComponent(btoa(JSON.stringify(cursorConfig)))}`;
      return {
        config: JSON.stringify(
          {
            mcpServers: {
              zeitflow: cursorConfig,
            },
          },
          null,
          2
        ),
        filename: "~/.cursor/mcp.json",
        deepLink,
      };
    }

    case "vscode":
      return {
        config: JSON.stringify(
          {
            mcpServers: {
              zeitflow: {
                serverUrl: `${url}/api/mcp`,
                headers: {
                  Authorization: `Bearer ${placeholder}`,
                },
              },
            },
          },
          null,
          2
        ),
        filename: ".vscode/mcp.json",
      };

    case "windsurf":
      return {
        config: JSON.stringify(
          {
            mcpServers: {
              zeitflow: {
                serverUrl: `${url}/api/mcp`,
                headers: {
                  Authorization: `Bearer ${placeholder}`,
                },
              },
            },
          },
          null,
          2
        ),
        filename: "~/.codeium/windsurf/mcp_config.json",
      };

    case "npm":
      return {
        config: JSON.stringify(
          {
            mcpServers: {
              zeitflow: {
                command: "npx",
                args: ["-y", "@zeitflow/mcp"],
                env: {
                  ZEITFLOW_API_TOKEN: placeholder,
                  ZEITFLOW_URL: url,
                },
              },
            },
          },
          null,
          2
        ),
      };

    default:
      return { config: "" };
  }
}

function getCliCommand(token: string): string {
  const placeholder = token || "YOUR_API_TOKEN";
  return `claude mcp add zeitflow --transport http --url "${getAppUrl()}/api/mcp" --header "Authorization: Bearer ${placeholder}"`;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ConnectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [apiToken, setApiToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client>("remote");

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  // Fetch API token
  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch("/api/user/api-token");
        const data = await res.json();
        setApiToken(data.apiToken ?? null);
      } catch {
        setApiToken(null);
      } finally {
        setLoadingToken(false);
      }
    }
    if (session) fetchToken();
  }, [session]);

  const generateNewToken = useCallback(async () => {
    setLoadingToken(true);
    try {
      const res = await fetch("/api/user/api-token", { method: "POST" });
      const data = await res.json();
      setApiToken(data.apiToken ?? null);
    } catch {
      /* ignore */
    } finally {
      setLoadingToken(false);
    }
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  const { config, filename, deepLink } = generateConfig(
    selectedClient,
    apiToken || ""
  );

  return (
    <div>
      <Head>
        <title>Connect - ZeitFlow</title>
        <meta
          name="description"
          content="Connect your AI agent or IDE to ZeitFlow via MCP"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-10 max-w-4xl min-h-[90vh]">
        {/* Nav */}
        <nav className="mb-10 flex justify-between items-center">
          <ul className="flex gap-4">
            <li>
              <Button
                href="/dashboard"
                variant="tertiary"
                className="!bg-transparent !p-0 hover:underline hover:text-foreground-light"
              >
                Back to Dashboard
              </Button>
            </li>
          </ul>
          <ProfileDropdown />
        </nav>

        <div className="bg-background-light rounded-lg p-8 shadow-lg space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Connect to ZeitFlow
            </h1>
            <p className="text-foreground-light">
              Hook up your AI agent, IDE, or CLI to ZeitFlow in under a
              minute. Pick your client, copy the config, and you&apos;re
              done.
            </p>
          </div>

          {/* ---- API Token ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              1. Your API Token
            </h2>
            <div className="bg-background-light-light p-4 rounded-lg">
              {loadingToken ? (
                <div className="text-sm text-foreground-light">
                  Loading token...
                </div>
              ) : apiToken ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <code className="flex-1 text-sm text-foreground font-mono bg-background-extra-light px-3 py-2 rounded break-all">
                      {apiToken}
                    </code>
                    <CopyButton text={apiToken} />
                  </div>
                  <Button
                    onClick={generateNewToken}
                    variant="secondary"
                    size="sm"
                    disabled={loadingToken}
                  >
                    Regenerate Token
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-foreground-light">
                    You don&apos;t have an API token yet.
                  </p>
                  <Button
                    onClick={generateNewToken}
                    variant="primary"
                    size="sm"
                    disabled={loadingToken}
                  >
                    Generate API Token
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* ---- Client picker ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              2. Choose Your Client
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {CLIENTS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClient(c.id)}
                  className={`text-left p-3 rounded-lg border transition-colors duration-150 cursor-pointer ${
                    selectedClient === c.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent bg-background-light-light text-foreground hover:bg-surface-hover"
                  }`}
                >
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs text-foreground-light mt-0.5">
                    {c.description}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ---- Config output ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              3. Copy &amp; Paste
            </h2>

            {/* Deep link button for Cursor */}
            {deepLink && (
              <div className="mb-4">
                <a
                  href={deepLink}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-invert font-medium text-sm hover:bg-primary/80 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Install in Cursor (one click)
                </a>
              </div>
            )}

            {/* Claude Code CLI one-liner */}
            {selectedClient === "claude-code" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground-light mb-1">
                  Or add via CLI:
                </label>
                <div className="flex items-start gap-2">
                  <pre className="flex-1 bg-background-extra-light p-3 rounded text-sm text-foreground font-mono overflow-x-auto whitespace-pre-wrap break-all">
                    {getCliCommand(apiToken || "")}
                  </pre>
                  <CopyButton text={getCliCommand(apiToken || "")} />
                </div>
              </div>
            )}

            {filename && (
              <p className="text-sm text-foreground-light mb-2">
                Add to{" "}
                <code className="bg-background-extra-light px-1.5 py-0.5 rounded text-xs">
                  {filename}
                </code>
              </p>
            )}

            <div className="relative">
              <pre className="bg-background-extra-light p-4 rounded-lg text-sm text-foreground font-mono overflow-x-auto whitespace-pre">
                {config}
              </pre>
              <div className="absolute top-3 right-3">
                <CopyButton text={config} />
              </div>
            </div>

            {selectedClient === "npm" && (
              <p className="text-sm text-foreground-light mt-2">
                Run{" "}
                <code className="bg-background-extra-light px-1.5 py-0.5 rounded text-xs">
                  npx -y @zeitflow/mcp
                </code>{" "}
                for a stdio bridge to the remote server. No repo clone
                needed.
              </p>
            )}
          </section>

          {/* ---- What you get ---- */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              What&apos;s Included
            </h2>
            <div className="bg-background-light-light p-4 rounded-lg">
              <p className="text-sm text-foreground-light mb-3">
                Once connected, your AI agent gets access to{" "}
                <strong className="text-foreground">16 tools</strong> for
                full workflow management:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                {[
                  ["list_node_types", "Discover node types"],
                  ["list_ai_models", "Browse AI models"],
                  ["create_workflow", "Create workflows"],
                  ["get_workflow", "Inspect workflow details"],
                  ["list_workflows", "List your workflows"],
                  ["update_workflow", "Update metadata/status"],
                  ["delete_workflow", "Delete workflows"],
                  ["add_node", "Add nodes to workflows"],
                  ["update_node", "Update node config"],
                  ["remove_node", "Remove nodes"],
                  ["connect_nodes", "Wire nodes together"],
                  ["remove_connection", "Remove connections"],
                  ["execute_workflow", "Run workflows"],
                  ["get_execution", "View execution logs"],
                  ["list_executions", "List past runs"],
                  [
                    "create_workflow_from_template",
                    "Build entire workflow in one call",
                  ],
                ].map(([tool, desc]) => (
                  <div key={tool} className="flex items-start gap-2 py-1">
                    <code className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                      {tool}
                    </code>
                    <span className="text-foreground-light">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
