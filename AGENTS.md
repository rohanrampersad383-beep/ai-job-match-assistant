<!-- gitnexus:start -->
# MatchIQ GitNexus Guidance

MatchIQ is indexed by GitNexus under the repository id **ai-job-match-assistant**.

Current index snapshot:

- Symbols: 1,365
- Relationships: 2,938
- Execution flows: 112

Use GitNexus when it will materially improve safety or navigation. It is most useful for understanding code paths, checking impact before risky changes, and validating the affected scope before commits.

> If GitNexus reports that the index is stale, run `gitnexus analyze` from the repository root before relying on graph results.

## Codex Notes

- GitNexus MCP tools may appear as namespaced tools such as `mcp__gitnexus__query`, `mcp__gitnexus__context`, `mcp__gitnexus__impact`, or similar `mcp__gitnexus__.*` names.
- If MCP tools are not available in the current session, use the GitNexus CLI where practical: `gitnexus analyze`, `gitnexus status`, and `gitnexus list`.
- Continue to inspect source files directly. GitNexus is a navigation and impact aid, not a replacement for reading the code.

## Recommended Use

Use GitNexus impact analysis before changes in high-risk areas:

- Scoring and ranking logic
- Discovery/import adapters and normalization
- Deduplication and source ingestion workflows
- Auth/session behavior
- Prisma schema or database migrations
- Review queue and opportunity workflow state
- Cross-cutting app shell or routing changes

For small copy, styling, spacing, or isolated UI polish edits, GitNexus impact analysis is optional. Use normal local inspection and verification unless the change touches shared primitives or stateful logic.

## Suggested Workflow

1. Check freshness when starting significant work:
   - `gitnexus status`
2. Explore unfamiliar areas:
   - Query for a concept or flow.
   - Read the returned files and symbols.
3. Before risky edits:
   - Run impact analysis for the target symbol or workflow.
   - Note direct callers, affected flows, and risk level.
4. Before committing meaningful code changes:
   - Use GitNexus change detection if available.
   - Run the repo's normal verification commands.

## Useful Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/ai-job-match-assistant/context` | Codebase overview and index freshness |
| `gitnexus://repo/ai-job-match-assistant/clusters` | Functional areas |
| `gitnexus://repo/ai-job-match-assistant/processes` | Execution flows |
| `gitnexus://repo/ai-job-match-assistant/process/{name}` | Step-by-step flow trace |

## Guardrails

- Do not treat high-risk impact results as blockers by default. Report the risk, verify assumptions, and choose a careful implementation path.
- Do not use broad find-and-replace for symbol renames. Prefer graph-aware rename tools when available, or perform a carefully reviewed manual rename.
- Do not commit `.gitnexus/`; it is local index state and should remain ignored.
- Do not rely on generated guidance over the actual application architecture, tests, and local verification results.

<!-- gitnexus:end -->
