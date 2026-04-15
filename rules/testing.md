# Testing rules

## Coverage expectations

Every component, utility, service, and module must have tests. Exceptions:

- Type-only files (`*.types.ts`, `*.d.ts`)
- Constants files with no logic
- Entry points whose only job is composition (a `main.ts` that wires DI and calls `run()`)

If a file has a branch, a loop, or a transformation, it has tests.

## Colocation

Tests live next to the code they test, with matching filenames:

```
src/clients/discord/discordClient.ts
src/clients/discord/discordClient.test.ts

src/core/retry/retry.ts
src/core/retry/retry.test.ts
```

Do not create a parallel `__tests__` tree or a top-level `/tests` mirror
of `/src`. Colocation keeps the test and the code in the same diff, the
same review, and the same mental model.

## Integration tests are separate

Full-flow tests that exercise multiple modules together — or real
external services — live under `/integration` at the repo root, not
colocated. These are the only tests allowed to touch the network, a
real browser, or a real third-party service.

- `/integration/clients/*` — one-file-per-client real-service checks
- `/integration/bots/*` — end-to-end bot flow against the real site
  (run sparingly; these are slow and can be flaky by nature)

## Unit tests run against interfaces, not implementations

Per `docs/architecture.md`: bots and core logic depend on interfaces, and
unit tests inject fakes. A unit test should never instantiate a real
`DiscordClient`, launch a real browser, or read the real clock.

If writing a unit test tempts you to spin up a real dependency, the seam
is wrong — fix the seam, not the test.

## Test style

- One behavior per test. Test names describe the behavior, not the method.
- Arrange / Act / Assert, with blank lines between the three.
- Prefer small hand-written fakes over mocking libraries. A fake that
  implements the interface is clearer and survives refactors better than
  a chain of `mock.mockReturnValueOnce`.
