# Retrospectives

When a feature or chat reaches a natural stopping point — a bot shipped,
a refactor finished, a thorny bug resolved — look back through the
conversation and ask: **did we learn anything worth writing down?**

Candidates to capture:

- A decision we made and the reasoning behind it → add to `docs/` (new
  file, or extend an existing one like `architecture.md`).
- A rule we arrived at the hard way (a convention, a "don't do X
  because Y") → add to `rules/`.
- A recurring procedure worth making repeatable → add to `skills/`.
- A durable preference about how the user wants to work → save as a
  memory entry.

Skip the trivia. The bar is: *would a future agent or a future us
benefit from this six months from now?* If yes, write it down and link
it from `AGENTS.md`. If the answer is only "it documents what we just
did," the git history already has that — leave it.

## Only document what survives a refactor

Documentation that describes specific file names, function signatures,
or current implementation details rots the moment the code moves.
Capture the things that *won't* change during a refactor:

- The **why** behind a decision (constraints, tradeoffs, ruled-out options).
- **Rules and conventions** we want to keep applying.
- **Concepts and boundaries** (what a "client" is, what belongs in `/src`
  vs `/bots`).
- **External facts** (site quirks, API gotchas, ToS posture).

Leave implementation details to the code itself. If a doc would need
an edit every time someone renames a function, it's the wrong doc.

## Guides

As patterns emerge, write longer-form guides under `docs/guides/` —
e.g. "Creating a new bot", "Adding a new client". A guide is worth
writing once we've done the thing twice and noticed the shape. Link
new guides from `AGENTS.md`.

Offer the retrospective proactively at the end of substantive work; the
user does not need to ask.
