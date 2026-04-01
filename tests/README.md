# Tests

`operatorkit` now combines script-driven demo checks with targeted unit coverage around
the runtime surfaces that matter most for public trust.

Automated checks:
- `npm run test`
- `npm run check`

Script-driven verification:
- `npm run verify:demo`
- `npm run replay:request -- demo/requests/list-queue.json`
- `npm run replay:request -- demo/requests/create-note-and-queue.json`
- `npm run replay:request -- demo/requests/send-connector-event.json`

Current unit coverage focuses on:
- policy tier access rules
- registry validation and schema enforcement
- runtime behavior for verified actions, blocked actions, and iteration limits
