# Runtime Core

`operatorkit` centers on a small runtime loop that makes tool use visible and auditable.

## Current Core Pieces

1. `src/core/types.ts`
   Shared contracts for policies, tools, action records, and run requests.
2. `src/core/tool-registry.ts`
   Tool registration, JSON Schema validation, and fail-closed access checks.
3. `src/runtime/agent-runtime.ts`
   The bounded execution loop that asks the model for tool calls, validates them, executes them, and records the results.
4. `src/models/demo-model.ts`
   A deterministic demo adapter that makes the runtime teachable without calling a paid model API.
5. `src/runtime/run-recorder.ts`
   Structured audit output for `request.json` and `run.json`.

## Verification-First Rule

The runtime records tool results with a verification state:
- `verified`
- `unverified`
- `blocked`

The final response is built from those recorded results. Confirmed language should only come from verified actions.

## Demo Flow

The current demo request path asks the runtime to:
1. create a note
2. inspect the queue
3. return a final response built from verified tool outcomes

That path is exercised with:

```bash
npm run verify:demo
```
