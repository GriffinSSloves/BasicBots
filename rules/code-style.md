# Code style rules

The goal is a codebase that's easy to come back to six months from now
and easy for someone new to pick up. Optimize for clarity and
sustainability, not for speed of writing.

## TypeScript

- **Strict mode on.** `strict: true` plus `noUncheckedIndexedAccess`,
  `noImplicitOverride`, `noFallthroughCasesInSwitch`,
  `exactOptionalPropertyTypes`.
- **No `any`.** Not in application code, not in tests. If a third-party
  type is missing, write a local declaration or use `unknown` + a type
  guard. `any` suppresses the tool we are paying for.
- **No non-null assertions (`!`)** except in test code where the
  invariant is obvious from the arrange block. Prefer a real check.
- **No `as` casts** except at system boundaries (parsing JSON, reading
  env vars) and only paired with a runtime validator (Zod or equivalent).
- **Prefer `type` aliases for data shapes**, `interface` for extensible
  contracts that consumers might implement or augment.

## Naming and structure

- One primary export per file; the filename matches the export.
- `camelCase` for values, `PascalCase` for types and classes,
  `SCREAMING_SNAKE_CASE` only for true constants.
- Folders are lowercase. Group by feature, not by kind — a client's
  interface, implementation, fake, and test live in the same folder.
- **No barrel files.** No `index.ts` re-export files, anywhere. Import
  every symbol directly from the file that defines it
  (`import { retry } from '@/core/retry/retry'`, not from `@/core`).
  Barrels hide real dependencies, slow tooling, and break tree-shaking.
  Enforced by lint (`no-restricted-imports` / oxlint equivalent) once
  the linter is configured.

## Functions

- Pure functions by default. Side effects live at the edges (clients,
  entry points).
- Small. If a function needs section comments to be readable, it wants
  to be two functions.
- Return early. No deep nesting when a guard clause works.
- Accept dependencies as parameters. See the DI rule in `architecture.md`.

## Comments

- Default to none. Names and types should carry the meaning.
- Write a comment when the *why* is non-obvious: a workaround, a subtle
  invariant, an external constraint. Never restate the *what*.
- No TODOs without an issue link or a date and owner.

## Error handling

- Throw `Error` subclasses with a descriptive name
  (`class StockFetchError extends Error`). Never throw strings.
- Catch only where you can add value: recover, retry, or translate. A
  `try/catch` that re-throws the same error is noise.
- At the bot's top level, one handler logs + notifies and exits with a
  non-zero code. Everywhere else, let errors propagate.

## Imports

- Absolute imports from `/src` via a path alias (`@/core/...`).
- No cross-bot imports. `/bots/a` never imports from `/bots/b`. Shared
  code must graduate to `/src`.
- `/src` never imports from `/bots`.
