import { useState, useEffect, useCallback } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/Button";
import {
  Workflow,
  ChevronRight,
  Check,
  Globe,
  ArrowRight,
} from "lucide-react";

type Client =
  | "claude-desktop"
  | "claude-code"
  | "cursor"
  | "vscode"
  | "windsurf"
  | "npm";

interface ClientMeta {
  id: Client;
  name: string;
}

const CLIENTS: ClientMeta[] = [
  { id: "claude-desktop", name: "Claude Desktop" },
  { id: "claude-code", name: "Claude Code" },
  { id: "cursor", name: "Cursor" },
  { id: "vscode", name: "VS Code" },
  { id: "windsurf", name: "Windsurf" },
  { id: "npm", name: "npx (local)" },
];

function getAppUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return "https://www.zeitflow.io";
}

function generateConfig(client: Client, token: string): string {
  const url = getAppUrl();
  const placeholder = token || "YOUR_API_TOKEN";

  if (client === "npm") {
    return JSON.stringify(
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
    );
  }

  return JSON.stringify(
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
}

function getCliCommand(token: string): string {
  const placeholder = token || "YOUR_API_TOKEN";
  return `claude mcp add zeitflow --transport http "${getAppUrl()}/api/mcp" --header "Authorization: Bearer ${placeholder}"`;
}

interface GetStartedProps {
  onCreateWorkflow: () => void;
}

export default function GetStarted({ onCreateWorkflow }: GetStartedProps) {
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client>("claude-desktop");
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch("/api/user/api-token");
        const data = await res.json();
        setApiToken(data.apiToken ?? null);
        if (data.apiToken) {
          setCompletedSteps((prev) => new Set([...prev, "token"]));
        }
      } catch {
        setApiToken(null);
      } finally {
        setLoadingToken(false);
      }
    }
    fetchToken();
  }, []);

  const generateNewToken = useCallback(async () => {
    setLoadingToken(true);
    try {
      const res = await fetch("/api/user/api-token", { method: "POST" });
      const data = await res.json();
      setApiToken(data.apiToken ?? null);
      if (data.apiToken) {
        setCompletedSteps((prev) => new Set([...prev, "token"]));
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingToken(false);
    }
  }, []);

  const config = generateConfig(selectedClient, apiToken || "");

  return (
    <div className="col-span-full space-y-8">
      {/* Header */}
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Get started with ZeitFlow
        </h2>
        <p className="text-foreground-light max-w-lg mx-auto">
          Connect your AI agent or IDE to ZeitFlow via MCP, or install the CLI.
          Your workflows become tools that AI agents can discover and use.
        </p>
      </div>

      {/* Step 1: Generate API Token */}
      <section className="bg-background-light rounded-lg p-6 border border-foreground/10">
        <div className="flex items-start gap-3 mb-4">
          <StepNumber number={1} done={completedSteps.has("token")} />
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Get your API token
            </h3>
            <p className="text-sm text-foreground-light">
              You need a token to authenticate your MCP client or CLI.
            </p>
          </div>
        </div>
        <div className="ml-10">
          {loadingToken ? (
            <div className="h-10 w-full max-w-md bg-background-extra-light animate-pulse rounded-lg" />
          ) : apiToken ? (
            <div className="flex items-center gap-3 flex-wrap">
              <code className="flex-1 min-w-0 text-sm text-foreground font-mono bg-background-extra-light px-3 py-2 rounded break-all">
                {apiToken}
              </code>
              <CopyButton text={apiToken} />
            </div>
          ) : (
            <Button
              onClick={generateNewToken}
              variant="primary"
              size="sm"
              disabled={loadingToken}
            >
              Generate API Token
            </Button>
          )}
        </div>
      </section>

      {/* Step 2: Connect via MCP */}
      <section className="bg-background-light rounded-lg p-6 border border-foreground/10">
        <div className="flex items-start gap-3 mb-4">
          <StepNumber number={2} />
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Connect via MCP
            </h3>
            <p className="text-sm text-foreground-light">
              Pick your client, copy the config, and your AI agent gets 16
              workflow tools instantly.
            </p>
          </div>
        </div>
        <div className="ml-10 space-y-4">
          {/* Client picker */}
          <div className="flex flex-wrap gap-2">
            {CLIENTS.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClient(c.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  selectedClient === c.id
                    ? "bg-primary text-primary-invert"
                    : "bg-background-extra-light text-foreground-light hover:bg-surface-hover"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Config block */}
          <div className="relative rounded-lg overflow-hidden border border-foreground/10">
            <pre className="bg-background-extra-light p-4 text-sm text-foreground font-mono overflow-x-auto whitespace-pre">
              {config}
            </pre>
            <div className="absolute top-3 right-3">
              <CopyButton text={config} />
            </div>
          </div>

          {/* Claude Code CLI shortcut */}
          {selectedClient === "claude-code" && apiToken && (
            <div>
              <label className="block text-sm font-medium text-foreground-light mb-1">
                Or add via CLI:
              </label>
              <div className="flex items-start gap-2">
                <pre className="flex-1 bg-background-extra-light p-3 rounded text-sm text-foreground font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {getCliCommand(apiToken)}
                </pre>
                <CopyButton text={getCliCommand(apiToken)} />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-foreground-light">
            <Globe className="w-4 h-4 flex-shrink-0" />
            <span>
              Need more options?{" "}
              <a
                href="/connect"
                className="text-primary hover:underline"
              >
                See all client configs
                <ArrowRight className="w-3 h-3 inline ml-0.5" />
              </a>
            </span>
          </div>
        </div>
      </section>

      {/* Step 3: Install CLI (optional) */}
      <section className="bg-background-light rounded-lg p-6 border border-foreground/10">
        <div className="flex items-start gap-3 mb-4">
          <StepNumber number={3} />
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Install the CLI
              <span className="ml-2 text-xs font-normal text-foreground-light px-2 py-0.5 rounded-full bg-background-extra-light">
                optional
              </span>
            </h3>
            <p className="text-sm text-foreground-light">
              Manage workflows, run executions, and configure integrations from
              your terminal.
            </p>
          </div>
        </div>
        <div className="ml-10 space-y-3">
          <div className="rounded-lg overflow-hidden border border-foreground/10">
            <div className="flex items-center gap-2 px-4 py-2 bg-background-extra-light border-b border-foreground/10">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-xs text-foreground-light ml-1">
                Terminal
              </span>
            </div>
            <div className="bg-background-extra-light px-4 py-3">
              <pre className="text-sm font-mono">
                <span className="text-primary">$</span>
                <span className="text-foreground">
                  {" "}
                  npx @zeitflow/mcp
                </span>
              </pre>
            </div>
          </div>
          <p className="text-sm text-foreground-light">
            Or use the full Rust CLI for advanced management:{" "}
            <code className="text-xs bg-background-extra-light px-1.5 py-0.5 rounded">
              zeitflow auth login
            </code>
            ,{" "}
            <code className="text-xs bg-background-extra-light px-1.5 py-0.5 rounded">
              zeitflow workflow list
            </code>
            ,{" "}
            <code className="text-xs bg-background-extra-light px-1.5 py-0.5 rounded">
              zeitflow workflow execute
            </code>
          </p>
        </div>
      </section>

      {/* Build visually — secondary */}
      <section className="bg-background-light rounded-lg p-6 border border-dashed border-foreground/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Workflow className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Or build visually
              </h3>
              <p className="text-sm text-foreground-light">
                Prefer a drag-and-drop interface? Create a workflow in the visual
                builder — it&apos;ll be available via MCP automatically.
              </p>
            </div>
          </div>
          <Button
            onClick={onCreateWorkflow}
            variant="secondary"
            size="sm"
            className="flex-shrink-0"
          >
            Create Workflow
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}

function StepNumber({ number, done }: { number: number; done?: boolean }) {
  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
        done
          ? "bg-green-500/20 text-green-500"
          : "bg-primary/10 text-primary"
      }`}
    >
      {done ? <Check className="w-4 h-4" /> : number}
    </div>
  );
}
