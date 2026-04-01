# Demo Assets

This directory holds demo-safe request fixtures, workspace fixtures, and future launch visuals.

## Request Fixtures

- `requests/list-queue.json`
  Read-level example for inspecting the queue.
- `requests/create-note-and-queue.json`
  Operate-level example that creates a note and then inspects the queue.
- `requests/send-connector-event.json`
  Admin-level example that queues a connector-style event in the demo outbox.

Run any fixture through the public runtime path with:

```bash
npm run replay:request -- demo/requests/create-note-and-queue.json
```

## Workspace Fixtures

- `workspaces/default-workspace.json`
  The default demo workspace used by local verification.

## Launch Assets

- `operatorkit-runtime-poster.svg`
  Repo-safe visual summary of the runtime and policy model.
- `operatorkit-social-preview.svg`
  Suggested GitHub social preview asset.
- `operatorkit-run-review.html`
  Static showcase page generated from the committed demo request and run artifacts.
- `operatorkit-run-review.png`
  Screenshot capture used in the top-level README.

Rules for anything added here:
- no real names, phone numbers, or emails
- no copied proprietary prompts or workflow transcripts
- no private connector payloads, URLs, or secrets
- no screenshots or logs from live systems
