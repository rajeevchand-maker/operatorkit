# Tests

`operatorkit` currently relies on script-driven smoke verification instead of a larger automated test suite.

The most important checks today are:
- `npm run check`
- `npm run verify:demo`
- `npm run replay:request -- demo/requests/list-queue.json`
- `npm run replay:request -- demo/requests/create-note-and-queue.json`
- `npm run replay:request -- demo/requests/send-connector-event.json`

This directory is reserved for future unit and integration tests as the operatorkit surface becomes more stable.
