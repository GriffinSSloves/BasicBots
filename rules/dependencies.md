# Dependency rules

## Stack posture

Modern but stable. Prefer tools that are (a) actively maintained,
(b) widely adopted in the TypeScript community, and (c) past the
"churning through breaking changes" phase. Examples of the posture:
Vite and Vitest over Webpack and Jest; `pnpm` or `npm` over yarn v1;
native Node `fetch` over `axios` unless we need a feature it lacks.

## When a dependency choice comes up

Do not silently pick. Present the user with:

1. The two or three real contenders (not an exhaustive list).
2. One or two sentences each on tradeoffs — maturity, maintenance
   activity, community adoption, footprint.
3. A recommendation and why.

Only install after the user chooses. This applies to linters,
test runners, validators, HTTP clients, scheduling libs, logging,
ORMs — anything that will shape how code in this repo is written.

## Keep the dependency surface small

Every dependency is a thing to update, audit, and reason about. Before
adding one, ask: can this be ~30 lines of code instead? If yes, write
the code. Reserve dependencies for problems that genuinely benefit from
a battle-tested solution (Puppeteer, Discord SDK, Zod).

## Update discipline

- Pin exact versions in `package.json` (no `^` or `~`). Renovate/Dependabot
  can propose bumps as PRs; we review them deliberately.
- Lockfile is committed.
- Security advisories are never ignored — patch or replace.
