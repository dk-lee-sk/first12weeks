Add a learning card about: $ARGUMENTS

1. Find current guidance from AAP/HealthyChildren.org, NHS, CDC or WHO. Paraphrase it in 1–3 short sentences, following the content rules in CLAUDE.md.
2. Add the card to `CARDS` in `src/content.js` with a unique `id`, `t`, `b` and `s` (source).
3. Decide how the player unlocks it:
   - a week intro (`WEEKS[n].c`), or
   - a `learn('<id>')` call in the matching action or event in `src/game.js`.
4. Run `npm test` and fix any failures.
5. Finish with a short summary: the card text, the source URL(s) you used, and a "Needs clinical review" note.
