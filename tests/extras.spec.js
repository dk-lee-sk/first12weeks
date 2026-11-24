// Sound, cheat sheet and feedback link.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { pathToFileURL } = require('url');

const URL = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;

async function startDay(page) {
  await page.goto(URL);
  await page.getByRole('button', { name: 'Start week 1' }).click();
  await page.getByRole('button', { name: /Start the day/ }).click();
}

test('audio.js never calls Math.random and works without Web Audio', () => {
  const code = fs.readFileSync(path.join(__dirname, '..', 'src', 'audio.js'), 'utf8');
  const M = Object.create(Math);
  M.random = () => { throw new Error('audio.js must not call Math.random'); };
  const sandbox = { window: {}, Math: M };
  vm.runInNewContext(code, sandbox);
  const A = sandbox.window.F12_AUDIO;
  expect(A.on).toBe(false);
  A.action('feed'); A.card(); A.cry({ kind: 'hunger', level: 'late' });
  expect(A.log.length).toBe(0); // off by default: nothing is requested
  A.set({ on: true });
  for (const k of ['feed', 'burp', 'change', 'sleep', 'soothe', 'play', 'bath', 'rest', 'help']) A.action(k);
  A.card(); A.day(); A.ambient(true); A.cry({ kind: 'sleep', level: 'mid' });
  expect(A.log).toContain('feed');
  expect(A.log).toContain('ambient');
  expect(A.log).toContain('cry:sleep/mid');
});

test('sound is off by default; the header button turns it on and actions make sounds', async ({ page }) => {
  await startDay(page);
  await expect(page.locator('#bSound')).toHaveText('🔇');
  expect(await page.evaluate(() => window.F12_AUDIO.log.length)).toBe(0);

  await page.locator('#bSound').click();
  await expect(page.locator('#bSound')).toHaveText('🔊');
  await expect(page.locator('#bSound')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('first12weeks.sound')).on)).toBe(true);

  await page.evaluate(() => { window.__F12.S.b.hunger = 60; });
  await page.locator('.act[data-k="feed"]').click();
  expect(await page.evaluate(() => window.F12_AUDIO.log)).toContain('feed');

  // A hungry baby cries softly, once the next tick runs.
  await page.evaluate(() => { const b = window.__F12.S.b; b.asleep = false; b.hunger = 92; });
  await expect.poll(() => page.evaluate(() => window.F12_AUDIO.log.some(n => n.startsWith('cry:hunger')))).toBe(true);
});

test('crying sounds can be switched off on their own', async ({ page }) => {
  await startDay(page);
  await page.locator('#bMenu').click();
  await page.locator('#mSound').check();
  await page.locator('#mCry').uncheck();
  await page.getByRole('button', { name: 'Done' }).click();
  await page.evaluate(() => { const b = window.__F12.S.b; b.asleep = false; b.hunger = 92; });
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => window.F12_AUDIO.log.some(n => n.startsWith('cry:')))).toBe(false);
  expect(await page.evaluate(() => window.F12_AUDIO.on)).toBe(true);
});

test('feedback: footer link and settings button go to the project’s GitHub issues', async ({ page }) => {
  await startDay(page);
  const link = page.locator('#fbLink');
  await expect(link).toHaveAttribute('href', /^https:\/\/github\.com\/dk-lee-sk\/first12weeks\/issues\/new\?/);
  await expect(link).toHaveAttribute('target', '_blank');
  // No personal data in the link.
  expect(await link.getAttribute('href')).not.toMatch(/@|localStorage/);

  await page.evaluate(() => { window.__opened = null; window.open = (u) => { window.__opened = u; return null; }; });
  await page.locator('#bMenu').click();
  await expect(page.locator('#sheet')).toContainText('leave out personal details');
  await page.getByRole('button', { name: 'Send feedback' }).click();
  expect(await page.evaluate(() => window.__opened)).toMatch(/github\.com\/dk-lee-sk\/first12weeks\/issues\/new/);
});

test('cheat sheet: unlocked cards, print and download', async ({ page }) => {
  await startDay(page);
  const titles = await page.evaluate(() => window.__F12.S.cards.length);
  expect(titles).toBeGreaterThan(0);
  await page.locator('#bJournal').click();
  await page.getByRole('button', { name: /Cheat sheet/ }).click();
  const sheet = page.locator('#sheet');
  await expect(sheet).toContainText('Cheat sheet');
  await expect(sheet).toContainText('Source:');
  await expect(sheet).toContainText('contact your doctor or midwife');
  await expect(sheet.locator('.cardx')).toHaveCount(titles);

  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  await sheet.getByRole('button', { name: /Print or save as PDF/ }).click();
  expect(await page.evaluate(() => window.__printed)).toBe(1);
  await expect(sheet).toContainText('Cheat sheet'); // stays open

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    sheet.getByRole('button', { name: 'Download as text' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('first-12-weeks-cheat-sheet.txt');
  const text = fs.readFileSync(await download.path(), 'utf8');
  expect(text).toContain('Source:');

  await sheet.getByRole('button', { name: 'Back' }).click();
  await expect(sheet).toContainText('Learning journal');
});

test('phone: header with the sound button fits at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startDay(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  const box = await page.locator('#bMenu').boundingBox();
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  await expect(page.locator('#wkLabel')).toBeVisible();
  // "Week 12 of 12" stays on one line and isn't clipped, even in the widest week.
  await page.evaluate(() => { document.getElementById('wkLabel').textContent = 'Week 12 of 12'; });
  const w = await page.locator('#wkLabel').evaluate(el => ({ s: el.scrollWidth, c: el.clientWidth, h: el.getBoundingClientRect().height, lh: parseFloat(getComputedStyle(el).lineHeight) }));
  expect(w.s).toBeLessThanOrEqual(w.c + 1);
  expect(w.h).toBeLessThanOrEqual(w.lh + 1);
});
