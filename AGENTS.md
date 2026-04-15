# AGENTS.md

Guidance for AI agents working in this repository. Claude Code and other
tools should read this file first.

## Repo purpose

BasicBots is a monorepo of small Puppeteer-driven bots (stock checkers,
lobby-login bots, etc.). Shared infrastructure lives in `/src`; each
bot has its own folder under `/bots`.

## Structure

- `/src/core` — browser launcher, session/cookie management, retry, logging
- `/src/clients` — thin wrappers around external services (Discord, Twilio,
  email, etc.). Each client sits behind an interface; see
  [docs/architecture.md](./docs/architecture.md).
- `/src/scheduler` — cron/interval runner
- `/bots/<name>` — per-bot site-specific logic (selectors, URLs, flow)

## Agent-facing folders

- [`/rules`](./rules) — durable code, testing, and style preferences. Read before writing code.
  - [testing.md](./rules/testing.md) — coverage, colocation, integration-vs-unit split.
  - [code-style.md](./rules/code-style.md) — TypeScript strictness, naming, comments, errors, imports.
  - [dependencies.md](./rules/dependencies.md) — how to pick and add dependencies.
  - [retrospectives.md](./rules/retrospectives.md) — at the end of a feature/chat, capture learnings into docs/rules/skills/memory.
- [`/docs`](./docs) — longer-form investigations and architecture decisions.
  - [architecture.md](./docs/architecture.md) — top-level architecture and the reasoning behind it.
  - `docs/guides/` — longer how-to guides (e.g. creating a new bot, adding a new client). Added as patterns emerge.
- [`/skills`](./skills) — runnable skills/procedures agents can invoke.

When you add a new rule, doc, or skill, link it from this file so future
agents can discover it.
