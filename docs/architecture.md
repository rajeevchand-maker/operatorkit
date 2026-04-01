# Architecture

`operatorkit` is structured around a small set of separable layers:

1. `src/core/`
   Shared contracts for policies, tools, requests, and action records.
2. `src/security/`
   Policy hierarchy and bearer-token auth for the local runtime surface.
3. `src/models/`
   Decision-making adapters. The current repo ships with a deterministic demo model.
4. `src/runtime/`
   The execution loop, workspace loading, and structured run recording.
5. `src/tools/`
   Public-safe example tools that demonstrate read, operate, and admin actions.

## Request Flow

1. A caller sends a bearer-authenticated request to `POST /runs`.
2. The runtime loads a demo workspace fixture.
3. The model decides whether to call tools or return a final answer.
4. Each tool call is validated against JSON Schema and policy tiers before execution.
5. Tool results include verification metadata.
6. The final response is built from recorded action results, not assumptions.
7. The runtime writes `request.json` and `run.json` into an artifact directory.

## Why This Shape

The repo is meant to teach trustworthy agent execution:
- tool contracts are explicit
- permissions are explicit
- verification is explicit
- audit output is explicit

That makes it easier to adapt the runtime without losing the safety boundary that gives the project its value.
