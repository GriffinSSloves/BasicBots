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

## Mocks and shared test infrastructure

Build mock infrastructure deliberately, but don't over-mock.

- **Mock at the interface seam, not inside.** If a test imports
  `DiscordClient` and the test wants to stub `sendMessage`, the test
  receives a fake `DiscordClient` via DI. The test should never reach
  inside `DiscordClient` to stub its internal `fetch` or its underlying
  SDK. If you find yourself doing that, the seam is in the wrong place.
- **Don't mock what you don't own.** Wrap third-party SDKs (Discord,
  Twilio, Puppeteer) behind our own interface in `/src/clients`, then
  mock our interface. This keeps tests stable across SDK upgrades.
- **Don't mock pure functions.** If the code under test calls a pure
  helper from `/src/core`, let it run. Mocking it adds noise without
  catching anything a real call wouldn't.
- **Shared fixtures live next to where they're used most.** A fake
  reused across one folder lives in that folder
  (e.g., `src/clients/discord/discordClient.fake.ts`). Promote to a
  shared location (`src/testing/`) only on the second consumer.
- **Test data factories over inline literals.** When a test needs a
  populated domain object, expose a factory with sensible defaults and
  per-test overrides:

  ```ts
  function makeStockResult(overrides: Partial<StockResult> = {}): StockResult {
    return { sku: "abc", inStock: true, priceCents: 1999, ...overrides };
  }
  ```

  Tests then assert on the field they care about, ignoring the rest.
  This dramatically reduces the blast radius when a type gains a field.
- **Prefer one fake per interface, reused.** A `FakeDiscordClient` that
  records calls (`sentMessages: Message[]`) beats a per-test
  `vi.fn()` jungle. Tests assert against the recorded list.

The bar: a test should fail when the *behavior* under test breaks,
and only then. If a refactor that preserves behavior breaks the test,
the test was coupled to implementation, not behavior.
