# Roadmap

Status: ✅ done · 🔜 next · ⏳ later

## M0 — Playable prototype ✅
One room, 9 actions, cue system, 12 weeks, 24 learning cards, daily summaries, easy mode, local save.

## M1 — Foundation 🔜
- ✅ Split into content / logic / styles; CLAUDE.md; seeded Playwright season test; CI; GitHub Pages deploy.
- 🔜 Energy balance: the reference bot ends most days at 80–100 energy. Tiredness should bite in weeks 5–8 so that rest and help matter (tune drain/rest rates in `stepMinute`).
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
