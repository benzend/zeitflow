# Zeitflow engine

Rust workspace for the workflow engine. Milestone 1a is `zf-core` only: types, graph validation, entry selection, and variable substitution. No database, no worker, no change to how `pages/api/workflow/[id]/execute.ts` runs a workflow.

The pure TypeScript the API uses lives in `lib/workflow-engine.ts`. `zf-core` is checked against that file by the parity harness.

## Layout

| Path | What it is |
| --- | --- |
| `crates/zf-core` | Library. No I/O. Types are exported to `bindings/` with ts-rs. |
| `crates/zf-parity` | Reads a fixture directory and prints replay JSON. Used by the harness. |
| `fixtures/handwritten` | Synthetic workflows committed for CI. No user data. |
| `fixtures/exported` | Gitignored output of the read-only DB dump. Do not commit. |
| `bindings/` | Generated TypeScript. `cargo test` rewrites it; CI fails if the diff is dirty. |

Conventions follow [rust-solid-starter](https://github.com/benzend/rust-solid-starter): Rust 1.99 (pinned in `engine/rust-toolchain.toml`), edition 2024, `unsafe_code` forbidden, `thiserror`, `tracing`, and CI for fmt, clippy `-D warnings`, tests, and cargo-deny. The toolchain file stays in this directory so the Vercel Next.js build does not try to install Rust.

## Commands

From `engine/`:

```bash
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
cargo run -p zf-parity -- fixtures/handwritten
```

From the repo root:

```bash
pnpm parity
pnpm export-fixtures
```

`pnpm parity` runs every handwritten fixture through `lib/workflow-engine.ts` and through `zf-parity`, and fails if validation, execution order, collected variables, or substituted configs differ.

## Fixture export

`scripts/export-workflow-fixtures.ts` is read-only. It sets the Postgres session to `READ ONLY`, starts `BEGIN READ ONLY`, and only sends `SELECT`. Use a Neon read-only role anyway.

```bash
DATABASE_URL='postgres://readonly:...@host/db' pnpm export-fixtures -- --limit 5
```

The dump can still contain prompts and form payloads. It is gitignored. Secret-shaped values are replaced with `***`.

## Substitution: one implementation, two in TypeScript today

`zf-core` follows `substituteVariables` in `execute.ts` (AI prompts), not `lib/integrations/executor.ts` (integration configs). The parity script fails if these disagreements move.

| Case | execute.ts (canonical) | executor.ts |
| --- | --- | --- |
| Missing `{{name}}` | Replaced with `""` | Placeholder kept |
| `{{ name }}` (spaces inside the braces) | Left unchanged. The name is trimmed for lookup, but the regex looks for `{{name}}` | Trimmed and replaced |
| Nested value is `null` | Replaced with `""` | Placeholder kept |
| `{{a}} {{b}}` when `a` is the text `{{b}}` | `b` is replaced in the inserted text too (`X X`) | Single pass (`{{b}} X`) |
| Value contains `$&`, `$'`, `` $` ``, `$$` | Expanded like `String.prototype.replace` | Left as written (function replacer) |
| Variables contain both an own key `"a.b"` and a nested `a.b` | Walks the path (`nested`) | Own key wins (`direct`) |

Shared behavior, which both sides and `zf-core` implement: `{{node.field}}` paths, `JSON.stringify` for objects and arrays, `String()` for numbers and booleans, no second scan of a value that does not itself contain a placeholder that was already in the original template.

`collectAvailableVariables` is only in the execute.ts path. Integration executors receive that bag and then run their own substituter. Notable shaper quirks the harness locks in:

- Email `messageId` is always `""`. `status` is `sent` or `failed`. The provider id is dropped.
- AI exposes `response` as `output`.
- A node type other than entry, ai, scheduler, email, slack, sms, telegram, condition, or review spreads its recorded output as-is (`http_request`, and the rest).
- Entry variables are copied from `inputData` only for `api`, `form`, and `webhook`. Falsy values (`0`, `false`, `""`) are kept.
- Labels become variable names with `labelToVariableName` (`Send Email!!!` → `send_email`).
- Ancestors are a BFS in connection order. The same snake_case label later in that walk overwrites the earlier one.
- A selected entry does not wait for the other roots. A merge runs when any executable predecessor finishes. In-degree counts distinct executable predecessors, but each edge decrements once, so two edges between the same nodes throw `negative in-degree`.
- A condition follows every edge when `output.path` is missing or empty. When `path` is set, every edge needs `sourceHandle` of `true` or `false`.

## Not reproduced

JavaScript `in` also sees prototype properties (`toString`, `constructor`). `zf-core` resolves JSON own properties, array indexes, and array `length` only. Templates do not use prototype names; the harness does not require those strings to match.

Numbers are IEEE-754, same as a JS `number`. Integers outside `±2^53` are formatted from the f64 JS would already be holding.
