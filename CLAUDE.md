# CLAUDE.md

## Package Manager

- This project uses `npm`.
- Use `npm ci --ignore-scripts` for installs that should respect the committed lockfile.
- Add dependencies with exact versions: `npm install --save-exact --ignore-scripts <package>`.
- Use `npx` only for tools already declared in this repo.
- Keep `package-lock.json` committed whenever dependencies change.

## Verification

- Run `npm run check` before committing code changes.
- When runtime behavior changes, also run `npm run verify:demo`.

## Secret Handling

- Do not read `.env` files or print environment variables.
- Treat `.env.example` as the only safe config template to inspect or reference.
- If a real token or secret is required, ask the user to provide or confirm it manually.

## Git Safety

- Do not use destructive git commands like `git reset --hard` or `git checkout --`.
- Do not force-push.
- Commit and push as separate deliberate steps.
