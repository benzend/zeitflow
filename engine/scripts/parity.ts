/**
 * Compare lib/workflow-engine.ts with zf-core on the handwritten fixtures.
 *
 * Run from the repo root:
 *   pnpm tsx engine/scripts/parity.ts
 *
 * Exits 0 when every fixture produces the same validation outcome, execution
 * order, collected variables, and substituted config. Also checks the known
 * places where execute.ts and lib/integrations/executor.ts disagree, and
 * checks that zf-core follows execute.ts on those strings.
 */

import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  replayWorkflow,
  substituteVariables as substituteExecute,
  type ReplayResult,
  type WorkflowConnection,
  type WorkflowNode,
} from "../../lib/workflow-engine";

const here = path.dirname(fileURLToPath(import.meta.url));
const engineDir = path.resolve(here, "..");
const fixturesDir = path.join(engineDir, "fixtures", "handwritten");

interface FixtureFile {
  name?: string;
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    entryType?: string | null;
    config?: unknown;
  }>;
  connections: WorkflowConnection[];
  inputData?: Record<string, unknown> | null;
  entryNodeId?: string | null;
  outputs?: Record<string, unknown>;
}

function normalizeConfig(config: unknown): string | undefined {
  if (config == null) return undefined;
  if (typeof config === "string") return config;
  return JSON.stringify(config);
}

function loadFixture(file: string): { name: string; result: ReplayResult } {
  const fixture = JSON.parse(readFileSync(path.join(fixturesDir, file), "utf8")) as FixtureFile;
  const nodes: WorkflowNode[] = fixture.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    label: node.label,
    entryType: node.entryType ?? undefined,
    config: normalizeConfig(node.config),
  }));
  const name = fixture.name ?? file.replace(/\.json$/, "");
  const result = replayWorkflow({
    nodes,
    connections: fixture.connections,
    inputData: fixture.inputData ?? {},
    entryNodeId: fixture.entryNodeId ? fixture.entryNodeId : undefined,
    outputs: fixture.outputs ?? {},
  });
  return { name, result };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      if (source[key] !== undefined) out[key] = canonicalize(source[key]);
    }
    return out;
  }
  return value;
}

function stable(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

interface RustPayload {
  results: Array<{ name: string; result: ReplayResult }>;
}

function rustResults(): Map<string, ReplayResult> {
  const cargo = spawnSync("cargo", ["run", "--quiet", "-p", "zf-parity", "--", fixturesDir], {
    cwd: engineDir,
    encoding: "utf8",
  });
  if (cargo.error) {
    throw cargo.error;
  }
  if (cargo.status !== 0) {
    throw new Error(`zf-parity exited ${cargo.status}\n${cargo.stderr}`);
  }
  const payload = JSON.parse(cargo.stdout) as RustPayload;
  return new Map(payload.results.map((item) => [item.name, item.result]));
}

interface Discrepancy {
  id: string;
  template: string;
  variables: Record<string, unknown>;
  execute: string;
  executor: string;
}

const discrepancies: Discrepancy[] = [
  {
    id: "missing-placeholder",
    template: "Hello {{name}}",
    variables: {},
    execute: "Hello ",
    executor: "Hello {{name}}",
  },
  {
    id: "interior-whitespace",
    template: "Hello {{ name }}",
    variables: { name: "Ada" },
    execute: "Hello {{ name }}",
    executor: "Hello Ada",
  },
  {
    id: "null-nested",
    template: "X{{a.b}}Y",
    variables: { a: { b: null } },
    execute: "XY",
    executor: "X{{a.b}}Y",
  },
  {
    id: "sequential-rescan",
    template: "{{a}} {{b}}",
    variables: { a: "{{b}}", b: "X" },
    execute: "X X",
    executor: "{{b}} X",
  },
  {
    id: "dollar-patterns",
    template: "x{{v}}y",
    variables: { v: "$&" },
    execute: "x{{v}}y",
    executor: "x$&y",
  },
  {
    id: "dotted-own-key",
    template: "{{a.b}}",
    variables: { "a.b": "direct", a: { b: "nested" } },
    execute: "nested",
    executor: "direct",
  },
];

async function assertDiscrepancies(): Promise<void> {
  process.env.DATABASE_URL ||= "postgres://parity:parity@127.0.0.1:1/parity";
  const executorModule = await import("../../lib/integrations/executor");
  const substituteExecutor = executorModule.substituteVariables;
  const failures: string[] = [];
  for (const sample of discrepancies) {
    const execute = substituteExecute(sample.template, sample.variables);
    const executor = substituteExecutor(sample.template, sample.variables);
    if (execute !== sample.execute) {
      failures.push(`${sample.id}: execute.ts produced ${JSON.stringify(execute)}, expected ${JSON.stringify(sample.execute)}`);
    }
    if (executor !== sample.executor) {
      failures.push(`${sample.id}: executor.ts produced ${JSON.stringify(executor)}, expected ${JSON.stringify(sample.executor)}`);
    }
    if (execute === executor) {
      failures.push(`${sample.id}: the two TypeScript substituters unexpectedly agree`);
    }
  }
  if (failures.length > 0) {
    throw new Error(`substitution discrepancies drifted:\n${failures.join("\n")}`);
  }
}

async function main(): Promise<void> {
  await assertDiscrepancies();

  const files = readdirSync(fixturesDir)
    .filter((file) => file.endsWith(".json") && !file.startsWith("_"))
    .sort();
  const typescript = new Map(files.map((file) => {
    const loaded = loadFixture(file);
    return [loaded.name, loaded.result] as const;
  }));
  const rust = rustResults();
  const failures: string[] = [];

  for (const [name, expected] of typescript) {
    const actual = rust.get(name);
    if (!actual) {
      failures.push(`${name}: missing from zf-core output`);
      continue;
    }
    if (stable(expected) !== stable(actual)) {
      failures.push(
        `${name}:\n  typescript ${stable(expected)}\n  zf-core    ${stable(actual)}`,
      );
    }
  }
  for (const name of rust.keys()) {
    if (!typescript.has(name)) {
      failures.push(`${name}: zf-core returned a fixture the TypeScript side did not run`);
    }
  }

  if (failures.length > 0) {
    console.error(`parity failed (${failures.length})\n${failures.join("\n")}`);
    process.exit(1);
  }
  console.log(`parity ok (${typescript.size} fixtures, execute.ts substitution)`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exit(1);
});
