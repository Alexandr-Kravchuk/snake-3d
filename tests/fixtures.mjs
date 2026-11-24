import { test as base, expect } from '@playwright/test';
export const GAME_URL = new URL('../index.html?test', import.meta.url).href;
export const TICK = 420; // ms per step on the default "Slow" difficulty
export const START_HEAD = { x: 6, y: 6, z: 6 };

/**
 * `game` fixture: page with a fake clock (paused), seeded Math.random and the ?test hook.
 * Time moves only through game.run(ms), so every step of the snake is deterministic.
 */
export const test = base.extend({
  game: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      let s = 0x5eed;
      Math.random = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    });
    await page.clock.install({ time: 0 });
    await page.clock.pauseAt(1000);
    await page.goto(GAME_URL);
    await page.clock.runFor(50);

    const game = {
      page,
      run: ms => page.clock.runFor(ms),
      state: () => page.evaluate(() => window.__snake.state),
      head: () => page.evaluate(() => window.__snake.snake[0]),
      snake: () => page.evaluate(() => window.__snake.snake),
      setFood: c => page.evaluate(c => window.__snake.setFood(c), c),
      /** press a key and let the instant step happen (turn gap is 50 ms) */
      press: async key => { await page.keyboard.press(key); await page.clock.runFor(70); },
    };
    await use(game);
    expect(errors, 'uncaught page errors').toEqual([]);
  },
});
export { expect };
