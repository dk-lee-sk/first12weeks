# First 12 Weeks

A gentle, no-fail newborn care game for soon-to-be parents and anyone curious about what the first months involve.

One nursery. One newborn. Twelve weeks, with one in-game day per week. Read the baby's cues (hunger, tiredness, wind, nappy, the evening crying peak) and choose the care that fits. Wrong guesses teach you the cue you missed. Look after yourself too: rest when the baby sleeps, and accept help.

> Educational only. Not medical advice. Content summarises public guidance (AAP, NHS, CDC and others) and is pending clinical review.

## Play
Open `index.html` in a browser. There's no build step.

## Develop
```bash
npm install
npx playwright install chromium   # first time only
npm test                          # content checks + full 12-week bot season
npm start                         # http://localhost:4173
```
Read [`CLAUDE.md`](CLAUDE.md) for the design principles, architecture and content rules, and [`ROADMAP.md`](ROADMAP.md) for what's next.

## Contributing
Issues and PRs welcome. Health content must cite a public source. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Licence
Code: MIT. Learning-card text: CC BY 4.0. See [`LICENSE`](LICENSE).
