# Release Readiness

Date: 2026-03-28

## Checks Run During Pre-Release Verification

- `npm run check`
- `npm run verify:demo`
- `npm run replay:request -- demo/requests/list-queue.json`
- `npm run replay:request -- demo/requests/create-note-and-queue.json`
- `npm run replay:request -- demo/requests/send-connector-event.json`

## Repo Readiness

- bounded runtime loop exists
- policy and schema enforcement exist
- structured run artifacts exist
- three example tools and request fixtures exist
- license, contributing guide, and security policy exist
- CI exists
- public-safety review exists

## Before Wider Launch

- set the repository social preview
- tag the first release
- do one final privacy review of README, docs, fixtures, and assets
