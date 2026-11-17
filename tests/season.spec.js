// Plays a full, seeded 12-week season with a reference bot and checks balance targets (see CLAUDE.md).
const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const URL = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;

// Reference bot: reads the strongest cue (plus an obvious dirty nappy) and responds ~60% of minutes; rests sometimes while baby sleeps.
const PLAY_DAY = `() => {
  const F = window.__F12;
  const MAP = {hunger:'feed', sleep:'sleep', diaper:'change', gas:'burp', purple:'soothe', bath:'bath', bored:'play'};
  for (let i = 0; i < 20000 && !F.S.dayOver; i++) {
    const t = F.top();
    if (F.S.b.asleep && !F.S.p.resting && Math.random() < 0.2) F.act('rest');
    // A sensible player deals with a dirty nappy before trying to settle baby.
    const k = t && (F.S.b.diaper === 'dirty' && t.k === 'sleep' ? 'change' : MAP[t.k]);
    if (k && Math.random() < 0.6) F.act(k); else F.stepMinute();
  }
  const ws = F.S.ws;
  return { min: F.S.min, week: F.S.week, feeds: ws.feeds, wet: ws.wet, dirty: ws.dirty,
           sleepH: +(ws.sleep / 60).toFixed(1), cryMin: ws.cry,
           cueAcc: ws.cues ? Math.round(ws.right / ws.cues * 100) : null,
           cards: F.S.cards.length, energy: Math.round(F.S.p.energy) };
}`;

test('a full seeded season stays within balance targets', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  // Seeded RNG so balance results are reproducible.
  await page.addInitScript(() => {
    let a = 12345;
    Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    try { localStorage.clear(); } catch (e) {}
  });
  await page.goto(URL);
  await page.getByRole('button', { name: 'Start week 1' }).click();
  await page.getByRole('button', { name: /Start the day/ }).click();

  const weeks = [];
  for (let w = 1; w <= 12; w++) {
    const stats = await page.evaluate(`(${PLAY_DAY})()`);
    weeks.push(stats);
    expect(stats.min, 'day should end').toBeGreaterThanOrEqual(1440);
    await expect(page.locator('#sheet .kicker')).toHaveText(`Week ${w} complete`);
    await page.locator('#sheet .btn.primary').click();
    if (w < 12) await page.getByRole('button', { name: /Start the day/ }).click();
  }
  await expect(page.locator('#sheet .kicker')).toHaveText('Twelve weeks');

  console.table(weeks);
  test.info().annotations.push({ type: 'season', description: JSON.stringify(weeks) });

  expect(errors).toEqual([]);
  for (const s of weeks) {
    expect(s.feeds, `week ${s.week} feeds`).toBeGreaterThanOrEqual(8);
    expect(s.feeds, `week ${s.week} feeds`).toBeLessThanOrEqual(14);
    expect(s.sleepH, `week ${s.week} sleep`).toBeGreaterThanOrEqual(12);
    expect(s.sleepH, `week ${s.week} sleep`).toBeLessThanOrEqual(18);
    expect(s.wet, `week ${s.week} wet nappies`).toBeGreaterThanOrEqual(5);
  }
  expect(weeks[11].cards).toBeGreaterThanOrEqual(18);
});

test('mobile layout: actions fit, no horizontal scroll', async ({ page }) => {
  await page.goto(URL);
  await page.getByRole('button', { name: 'Start week 1' }).click();
  await page.getByRole('button', { name: /Start the day/ }).click();
  await expect(page.locator('.act')).toHaveCount(9);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
