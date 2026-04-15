# Architecture

This document captures the top-level architectural decisions for BasicBots
and the reasoning behind them. Update it when a decision changes.

## Monorepo, single package

One `package.json` at the repo root. All bots share a single dependency
tree and TypeScript/tooling config.

**Why:** The bots (Riftbound stock checker, ticket lobby login, etc.) all
use Puppeteer and share clients (Discord, Twilio, email), session/cookie
handling, scheduling, and logging. Splitting into workspaces now would be
premature; the shared surface is larger than the per-bot surface.

**When to revisit:** Split into workspaces if (a) two bots need conflicting
dep versions, (b) we want to deploy/publish them independently, or (c) a
single bot grows a large enough surface to justify isolation.

## Layout

```
/src
  /core        browser launcher, session mgmt, retry, logging
  /clients     external service wrappers (Discord, Twilio, email, ...)
  /scheduler   cron/interval runner
/bots
  /<bot-name>  site-specific selectors, URLs, and flow for one bot
/rules /docs /skills   agent-facing guidance
```

Shared code lives under `/src`. A bot folder should be thin: compose
shared primitives with site-specific logic.

**Promote to `/src` on the second use, not the first.** One bot's helper
stays in that bot's folder until a second bot needs it.

## Interfaces and dependency injection

Every external dependency — Puppeteer browser, Discord, Twilio, email,
filesystem, clock — is accessed through an interface. Bots and core
logic receive their collaborators via constructor/function injection.
No module-level `new DiscordClient()` or singleton imports of side-effectful
clients.

**Why:**
- Unit tests run against fake implementations of the interfaces; no
  network, no browser, no flake.
- Swapping a client (e.g., email provider) is a one-file change.
- Forces us to name the capability we actually depend on, not the vendor.

## Testing strategy

- **Clients** (`/src/clients/*`) — integration tests against the real
  service (or a recorded fixture where the real service is impractical).
  These are the only tests allowed to hit the network.
- **Everything else** — unit tests using fakes that implement the client
  interfaces. Fast, deterministic, runnable offline.

A bot's test suite should never need a real Discord token or a real
browser. If it does, the seam is in the wrong place.

## Legal / ToS posture

Some bot ideas (ticket purchasing) brush against site terms of service.
Default posture: bots log in and notify at the right moment, leaving the
human to complete the action. We do not automate checkout, bypass queues,
or evade rate limits. This should be a rule in `/rules` before the second
bot lands.
