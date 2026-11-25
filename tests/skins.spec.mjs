import { test, expect } from './fixtures.mjs';

test.describe('skins', () => {
  test('skin select changes the skin and is remembered after a reload', async ({ game }) => {
    const { page } = game;
    await expect(page.locator('#skin')).toHaveValue('classic');
    await page.locator('#skin').selectOption('dragon');
    expect(await page.evaluate(() => window.__snake.skin)).toBe('dragon');
    await expect(page.locator('#toast')).toHaveText('Red Dragon');
    await page.reload();
    await game.run(50);
    await expect(page.locator('#skin')).toHaveValue('dragon');
    expect(await page.evaluate(() => window.__snake.skin)).toBe('dragon');
  });

  test('K cycles skins during a game without pausing it, in any layout', async ({ game }) => {
    const { page } = game;
    await game.press('Space');
    await game.press('KeyK');
    expect(await page.evaluate(() => window.__snake.skin)).toBe('dragon');
    await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'л', bubbles: true })));
    expect(await page.evaluate(() => window.__snake.skin)).toBe('frost');
    expect(await game.state()).toBe('playing');
    await expect(page.locator('#skin')).toBeEnabled();
  });
});

test.describe('dragon fire breath', () => {
  test('the dragon breathes fire when it eats; other skins do not', async ({ game }) => {
    const { page } = game;
    const fire = () => page.evaluate(() => window.__snake.fire);
    await game.press('Space');
    await game.setFood({ x: 7, y: 6, z: 6 });
    await game.run(420);
    expect(await fire()).toBe(0);

    await page.locator('#skin').selectOption('dragon');
    const h = await game.head();
    await game.setFood({ x: h.x + 1, y: h.y, z: h.z });
    await game.run(440);
    expect(await fire()).toBeGreaterThan(20);
  });
});
