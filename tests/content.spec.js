// Content integrity: every card is well-formed and sourced, every reference resolves.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadContent() {
  const code = fs.readFileSync(path.join(__dirname, '..', 'src', 'content.js'), 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox);
  return sandbox.window.F12_CONTENT;
}

test('learning cards are complete, unique and sourced', () => {
  const { CARDS } = loadContent();
  const ids = CARDS.map(c => c.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const c of CARDS) {
    expect(c.t, c.id).toBeTruthy();
    expect(c.b.length, c.id).toBeGreaterThan(30);
    expect(c.s, `${c.id} needs a source`).toBeTruthy();
  }
});

test('all 12 weeks exist and reference real cards', () => {
  const { CARDS, WEEKS } = loadContent();
  const ids = new Set(CARDS.map(c => c.id));
  for (let w = 1; w <= 12; w++) {
    expect(WEEKS[w], `week ${w}`).toBeTruthy();
    expect(WEEKS[w].n.length).toBeGreaterThan(0);
    for (const id of WEEKS[w].c) expect(ids.has(id), `week ${w} → ${id}`).toBe(true);
  }
});

test('every learn() call in game.js points to a real card', () => {
  const { CARDS } = loadContent();
  const ids = new Set(CARDS.map(c => c.id));
  const game = fs.readFileSync(path.join(__dirname, '..', 'src', 'game.js'), 'utf8');
  const used = [...game.matchAll(/learn\('([a-z]+)'\)/g)].map(m => m[1]);
  expect(used.length).toBeGreaterThan(10);
  for (const id of used) expect(ids.has(id), id).toBe(true);
});

test('every cue type has a lesson', () => {
  const { CUES, LESSON } = loadContent();
  expect(Object.keys(LESSON).sort()).toEqual(Object.keys(CUES).sort());
});
