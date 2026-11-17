# First 12 Weeks — project guide for Claude Code

A no-fail, open-source learning game for expecting parents. One nursery, one newborn, twelve in-game days (one per week of life). The player learns to **read baby cues** and look after themselves. It's not a test of reflexes.

## Product principles (non-negotiable)
1. **No failure state.** Nothing dies, ends or scores "game over". Wrong choices explain the cue that was missed.
2. **Teach cue-reading.** Cues show up before crying does. Meters and hints stay off by default (Easy mode only).
3. **Honest but kind.** Tiredness, crying peaks and night feeds are real and stay in. Treat them with empathy, never as punishment.
4. **Parent wellbeing is part of the loop.** Resting, asking for help and stepping away safely are valid moves, never penalised.
5. **Inclusive by default.** No assumptions about gender, family structure or feeding method (breast, formula and combination are all normal).

## Content rules (health information)
- Every learning card in `src/content.js` needs a public source in `s`. Use AAP/HealthyChildren.org, NHS, CDC, WHO or national equivalents. Never use blogs or forums.
- Paraphrase the guidance. Never copy text from sources.
- Phrase it as education, not advice. When a decision is safety-critical (fever, pale poo, breathing, dehydration), the card ends with "contact your doctor/midwife".
- If sources disagree or the evidence is soft, say so ("ranges vary").
- Mark new or changed cards in the PR description so a clinical reviewer can check them. Status: **pending clinical review** for all v0.x content.

## Architecture (no build step)
```
index.html        markup + SVG nursery scene
src/style.css     all styles (CSS variables at :root)
src/content.js    CARDS, WEEKS, CUES, LESSON  → window.F12_CONTENT
src/growth.js     WHO growth tables (weight, length, head; weeks 0–13) and the baby's growth model → window.F12_GROWTH
src/game.js       state, simulation (stepMinute), actions (EFF), rendering, modals, health panel
tests/            Playwright: content integrity, growth data + health panel, full 12-week bot season
```
- Plain classic scripts so `index.html` opens straight from disk. Don't add a bundler or framework unless a roadmap item clearly needs one.
- Time model: `S.min` counts game minutes from 07:00 (1440 per day). One real second is 5 game minutes × speed, ×4 while resting or while a helper is on shift.
- Needs: `needs()` turns baby state into cue strengths 0–100. `top()` is the strongest cue ≥35. Levels: early <60, mid <85, late (crying) ≥85.
- Balance knobs live in `cfg(week)` in `game.js` (feed interval, awake window, feed length, crying-peak probability, nap and night lengths, parent `strain` and `restRate`).
- `window.__F12` exposes state and functions for tests. Keep it.
- Save: `localStorage` key `first12weeks.v2`, always wrapped in try/catch. Bump the version key whenever you change the state shape. (v2 added `S.g`, the baby's growth profile; v1 saves are ignored.)
- Health panel: weight, length and head from `src/growth.js` (WHO percentile tables copied exactly, boys and girls averaged so there is no sex assumption), plus today's feeds, nappies, sleep, tummy time and baths. Phone: a strip under the energy bar opens a sheet. Wide screens (≥900px): a live side panel. Week 1 weight dips a little below birth weight (a game choice, noted in `growth.js`) and shows no percentile until week 2. `growth.js` must never call `Math.random` or the seeded balance test shifts; it uses `crypto` for the baby's profile.

## Balance targets (checked by `tests/season.spec.js`)
Per in-game day, with the reference bot:
- Feeds 8–14 · baby sleep 12–18 h · wet nappies ≥5
- Crying minutes: low outside weeks 5–8, visible rise during the peak
- Parent energy at end of day (bot rests whenever baby sleeps): ≥25 every week, ≤60 in weeks 5–8, and avg of weeks 5–8 at least 10 below weeks 1–4 and 25 below weeks 9–12. Resting beats not resting, and asking for help beats resting alone.
- No page errors. The season reaches the finale and unlocks ≥18 cards.

## Commands
- `npm install` then `npx playwright install chromium` (first run only)
- `npm test`: content checks plus a full seeded 12-week season (prints per-week stats)
- `npm start`: serves locally at http://localhost:4173. Opening `index.html` directly also works.

## Definition of done for any change
1. `npm test` passes.
2. You played the affected flow in a browser (mobile width ~390px): no layout overflow, and buttons still fit in 3×3.
3. New health content follows the content rules above.
4. Update `ROADMAP.md` status if a roadmap item moved.

## Style
Warm, calm, plain English. UK/US-neutral where possible ("nappy/diaper" is a known gap, see roadmap: localisation). Keep copy short: it's read on phones.
