# Contributing

Thanks for your interest in improving this project.

## Before You Start

- Open an issue or discussion for substantial changes before writing a large PR.
- Keep pull requests focused. Small, well-scoped changes are much easier to review and merge.
- Update docs when behavior or setup changes.

## Safety Rules

- Do not commit secrets, tokens, passwords, or private URLs.
- Do not add real personal data to code, fixtures, screenshots, or tests.
- Do not submit copied proprietary workflows, private prompts, or customer-specific assets.
- Prefer demo-safe fixtures and synthetic data.

## Code Changes

- Follow the existing project structure and naming.
- Add or update tests when the repo already has a test path for the area you changed.
- Document new environment variables in `.env.example` and the README.
- If the repo includes a `For Claude / Codex` section, keep it accurate when architecture changes.

## AI-Assisted Contributions

AI tools are welcome, but contributors are responsible for reviewing the output before submitting it.

When adapting the project with Claude or Codex:
- start from the README and the `For Claude / Codex` section
- keep changes within the documented customization points when possible
- verify that generated code does not introduce secrets or private data

## Pull Request Notes

Please include:
- what changed
- why it changed
- how you verified it
- any setup or migration impact

## Conduct

Be respectful, direct, and collaborative. The goal is a repo that is easy to learn from and safe to reuse.
