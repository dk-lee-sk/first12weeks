// Growth data and the health panel: WHO tables are intact, the model stays inside the typical range,
// and the panel shows on phone (sheet) and wide screens (side panel).
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { pathToFileURL } = require('url');

const URL = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;

function loadGrowth() {
  const code = fs.readFileSync(path.join(__dirname, '..', 'src', 'growth.js'), 'utf8');
  // growth.js must not use Math.random (it would shift the seeded balance test), so make it throw.
  const M = Object.create(Math);
  M.random = () => { throw new Error('growth.js must not call Math.random'); };
  const sandbox = { window: {}, Math: M };
  vm.runInNewContext(code, sandbox);
  return sandbox.window.F12_GROWTH;
}
function seededRng(seed) {
  let a = seed;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

test('WHO tables are complete and ordered', () => {
  const G = loadGrowth();
  for (const m of ['weight', 'length', 'head']) {
    for (const sex of ['boys', 'girls']) {
      const t = G.T[m][sex];
      for (const k of G.K) expect(t[k].length, `${m} ${sex} ${k}`).toBe(14);
      for (let w = 0; w <= 13; w++) {
        const row = G.K.map(k => t[k][w]);
        for (let i = 1; i < row.length; i++) expect(row[i], `${m} ${sex} week ${w}`).toBeGreaterThan(row[i - 1]);
      }
      for (let w = 1; w <= 13; w++) expect(t.p50[w], `${m} ${sex} median week ${w}`).toBeGreaterThanOrEqual(t.p50[w - 1]);
    }
  }
  // Spot checks against the printed WHO tables.
  expect(G.T.weight.boys.p50[0]).toBe(3.3);
  expect(G.T.weight.boys.p50[13]).toBe(6.4);
  expect(G.T.weight.girls.p50[0]).toBe(3.2);
  expect(G.T.weight.girls.p50[13]).toBe(5.8);
  expect(G.T.length.boys.p50[0]).toBe(49.9);
  expect(G.T.length.girls.p50[13]).toBe(59.8);
  expect(G.T.head.boys.p50[0]).toBe(34.5);
  expect(G.T.head.boys.p50[13]).toBe(40.5);
  expect(G.T.head.girls.p50[0]).toBe(33.9);
  expect(G.T.head.girls.p97[13]).toBe(41.9);
});

test('z-scores, percentiles and values convert both ways', () => {
  const G = loadGrowth();
  for (const m of ['weight', 'length', 'head']) {
    for (const w of [0, 1, 6.5, 12]) {
      expect(G.valueAt(m, w, 0)).toBeCloseTo(G.quantiles(m, w)[2], 6);
      for (const z of [-1.5, -0.4, 0, 0.7, 1.6]) expect(G.zOf(m, w, G.valueAt(m, w, z))).toBeCloseTo(z, 6);
    }
  }
  expect(G.percentile(0)).toBe(50);
  expect(G.percentile(-1.036)).toBe(15);
  expect(G.percentile(1.881)).toBe(97);
  expect(G.ordinal(2)).toBe('2nd');
  expect(G.ordinal(11)).toBe('11th');
  expect(G.ordinal(43)).toBe('43rd');
  expect(G.lbOz(3.4)).toEqual({ lb: 7, oz: 8 });
});

test('every simulated baby stays in the typical range and keeps growing', () => {
  const G = loadGrowth();
  const rng = seededRng(2026);
  for (let n = 0; n < 60; n++) {
    const baby = G.newBaby(rng);
    let prev = G.measure(baby, 0);
    for (let w = 1; w <= 12; w++) {
      const m = G.measure(baby, w);
      for (const k of ['length', 'head']) {
        expect(m[k].v, `${k} week ${w}`).toBeGreaterThanOrEqual(Math.round(m[k].lo * 10) / 10 - 0.05);
        expect(m[k].v, `${k} week ${w}`).toBeLessThanOrEqual(Math.round(m[k].hi * 10) / 10 + 0.05);
        expect(m[k].v, `${k} week ${w} grows`).toBeGreaterThanOrEqual(prev[k].v);
        expect(m[k].pct).toBeGreaterThanOrEqual(3);
        expect(m[k].pct).toBeLessThanOrEqual(97);
      }
      if (w === 1) {
        // Early weight loss: a small dip below birth weight, never a large one.
        expect(m.weight.dip).toBe(true);
        expect(m.weight.v).toBeLessThan(prev.weight.v);
        expect(m.weight.v).toBeGreaterThan(prev.weight.v * 0.92);
      } else {
        expect(m.weight.dip).toBe(false);
        expect(m.weight.v, `weight week ${w}`).toBeGreaterThanOrEqual(m.weight.lo);
        expect(m.weight.v, `weight week ${w}`).toBeLessThanOrEqual(m.weight.hi);
        expect(m.weight.v, `weight week ${w} grows`).toBeGreaterThan(prev.weight.v);
      }
      prev = m;
    }
  }
});

test('phone: health strip opens a sheet with growth and today so far', async ({ page }) => {
  await page.goto(URL);
  await page.getByRole('button', { name: 'Start week 1' }).click();
  await page.getByRole('button', { name: /Start the day/ }).click();
  await expect(page.locator('#bHealth')).toBeVisible();
  await expect(page.locator('#hsText')).toHaveText(/^\d\.\d\d kg · \d\d\.\d cm$/);
  await expect(page.locator('#healthSide')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);

  await page.locator('#bHealth').click();
  const sheet = page.locator('#sheet');
  await expect(sheet).toContainText('Baby’s health');
  for (const t of ['Weight', 'Length', 'Head', 'Feeds', 'Nappies', 'Sleep']) await expect(sheet).toContainText(t);
  // Compact by default: the detail only appears after "More info".
  await expect(sheet).not.toContainText('percentile');
  await expect(sheet).not.toContainText('Not medical advice');
  // One-line key and caveat are always visible.
  for (const t of ['your baby', 'typical range', 'middle', 'isn’t a score of your baby’s health']) await expect(sheet).toContainText(t);
  await expect(sheet).not.toContainText('Reading the bars');
  await sheet.getByRole('button', { name: /More info/ }).click();
  await expect(sheet).toContainText('Reading the bars');
  await expect(sheet).toContainText('aren’t a measure of overall health');
  await expect(sheet).toContainText('Percentiles start at week 2'); // week 1: weight dips, no percentile yet
  await expect(sheet).toContainText('WHO Child Growth Standards');
  await expect(sheet).toContainText('Not medical advice');
  await sheet.getByRole('button', { name: /Less info/ }).click();
  await expect(sheet).not.toContainText('percentile');
  expect(await page.evaluate(() => window.__F12.S.cards.includes('growth'))).toBe(true);
  await page.locator('#sheet .btn.primary').click();
  await expect(page.locator('#overlay')).toBeHidden();
});

test('wide screen: side panel shows live health; save format is v2', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto(URL);
  await page.getByRole('button', { name: 'Start week 1' }).click();
  await page.getByRole('button', { name: /Start the day/ }).click();
  const side = page.locator('#healthSide');
  await expect(side).toBeVisible();
  await expect(page.locator('#bHealth')).toBeHidden();
  await expect(side).toContainText('Weight');
  await expect(side).toContainText('Today');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);

  // Go to week 2: percentiles appear and the weight is a gain on last week.
  await page.locator('#bMenu').click();
  await page.getByRole('button', { name: 'Skip to end of this day' }).click();
  await page.getByRole('button', { name: /On to week 2/ }).click();
  await page.getByRole('button', { name: /Start the day/ }).click();
  await expect(side).toContainText('Week 2 of 12');
  await expect(page.locator('#healthSide .gbar:not(.off)')).toHaveCount(3);
  await expect(side).not.toContainText('percentile');
  await side.getByRole('button', { name: /More info/ }).click();
  await expect(side).toContainText(/percentile/);
  await expect(side).toContainText(/up \d+ g since last week/);

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('first12weeks.v2')));
  expect(saved.v).toBe(2);
  expect(saved.g).toBeTruthy();
  expect(await page.evaluate(() => localStorage.getItem('first12weeks.v1'))).toBeNull();
});
