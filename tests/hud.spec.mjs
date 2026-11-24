import { test, expect } from './fixtures.mjs';

test.describe('HUD and start screen', () => {
  test('shows the start overlay and initial HUD', async ({ game: { page } }) => {
    await expect(page.locator('#overlay')).toContainText('True 3D Snake');
    await expect(page.getByRole('button', { name: '▶ Start 3D game' })).toBeVisible();
    await expect(page.locator('#score')).toHaveText('0');
    await expect(page.locator('#best')).toHaveText('0');
    await expect(page.locator('#len')).toHaveText('4');
    await expect(page.locator('#coords')).toHaveText('X7 Y7 Z7');
    await expect(page.locator('#speed')).toHaveText('×1.0');
    await expect(page.locator('#diffBadge')).toHaveText('Slow');
    await expect(page.locator('#pauseBtn')).toHaveText('Pause');
  });

  test('difficulty is editable before the game and locked during it', async ({ game }) => {
    const { page } = game;
    await page.locator('#difficulty').selectOption('hard');
    await expect(page.locator('#diffBadge')).toHaveText('Fast');
    expect(await page.evaluate(() => window.__snake.tickMs)).toBe(240);

    await page.getByRole('button', { name: '▶ Start 3D game' }).click();
    await expect(page.locator('#overlay')).toBeHidden();
    expect(await game.state()).toBe('playing');
    await expect(page.locator('#difficulty')).toBeDisabled();
  });

  test('coordinates badge follows the head', async ({ game }) => {
    const { page } = game;
    await page.getByRole('button', { name: '▶ Start 3D game' }).click();
    await game.run(420 * 3 + 10);
    expect(await game.head()).toEqual({ x: 9, y: 6, z: 6 });
    await expect(page.locator('#coords')).toHaveText('X10 Y7 Z7');
  });
});
