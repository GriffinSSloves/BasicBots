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

- Use caret ranges (`^1.2.3`) for post-1.0 packages. The committed
  lockfile (`pnpm-lock.yaml`) is what guarantees reproducibility — the
  range in `package.json` just controls what `pnpm install` is allowed
  to bump to.
- **Pin exact versions for pre-1.0 packages** (`0.x.y`). Semver minors
  are breaking by convention pre-1.0, so a `^0.45.0` range can ship a
  breaking change. Bump these manually.
- Lockfile is always committed.
- Security advisories are never ignored — patch or replace.
