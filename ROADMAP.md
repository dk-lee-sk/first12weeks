# Roadmap

Status: ✅ done · 🔜 next · ⏳ later

## M0 — Playable prototype ✅
One room, 9 actions, cue system, 12 weeks, 24 learning cards, daily summaries, easy mode, local save.

## M1 — Foundation 🔜
- ✅ Split into content / logic / styles; CLAUDE.md; seeded Playwright season test; CI; GitHub Pages deploy.
- ✅ Energy balance: the reference bot used to end most days at 80–100 energy. Now `cfg(week).strain` (passive drain and per-action cost, ×1.5 in weeks 5–8, ×1.25 in weeks 3–4 and 9–10) and `cfg(week).restRate` (0.15/min) make tiredness bite in the crying peak. The reference bot ends weeks 5–8 at about 35–60, and weeks 1–4 at 55–70. Weeks 9–12 recover to 90+. Resting and asking for help each make a measurable difference (tested in `tests/season.spec.js`). Still to do: move these knobs into `src/balance.js` with the real-world basis.
- ✅ Health panel: weight, length and head vs WHO percentiles, plus today's feeds, nappies, sleep and tummy time. Two new learning cards (`weightloss`, `growth`), marked **pending clinical review**. Later: a unit toggle (kg/cm vs lb/in), a growth chart across the 12 weeks, and a choice of sex-specific curves in M2.
- 🔜 Move balance constants from `cfg()` into `src/balance.js` with comments citing the real-world basis.
- 🔜 Add source URLs to every card (`url` field) and show them as links in the journal.
- 🔜 Accessibility pass: focus order, visible focus, `prefers-reduced-motion`, colour contrast ≥4.5:1.
  *Done when:* Lighthouse a11y ≥95 at 390px.

## M2 — Content credibility
- Clinical review by a midwife or paediatric nurse. Track it per card (`reviewed: 'YYYY-MM-DD'`).
- Feeding-method choice at the start (breast, formula, combination), changing cues, feed durations and copy.
- "Know when to call" scenarios: fever check, pale poo, fewer wet nappies, breathing. The player picks between watch / call doctor / emergency, and gets an explanation.
  *Done when:* every safety-critical card has a matching scenario and a reviewer sign-off.

## M3 — Feel
- Sound via Web Audio (synthesised coos, cries, lullaby hum), with a mute toggle. No copyrighted audio.
- Richer SVG states: feeding pose, burp on shoulder, bath tub, swaddle/sleep sack.
- Day/night transitions, a lamp toggle, window weather.
- Haptics on phones where supported.

## M4 — Partner mode
- Two named parents with separate energy bars. Pass-and-play on one device first.
- Night-shift planning at the start of each day; the summary compares how load was shared.
  *Done when:* a two-player season completes, and the summary shows each parent's share of feeds, changes and sleep.

## M5 — Learning depth
- End-of-week 3-question check (optional) drawn from unlocked cards.
- Journal export as a printable "cheat sheet" page.
- Localisation: string table, then Korean and French.

## M6 — Distribution & validation
- Installable offline PWA (manifest plus service worker on GitHub Pages).
- itch.io page and press kit.
- 5-couple playtest protocol (`docs/playtest.md`). Success = ≥3 of 5 say they learned something new.
