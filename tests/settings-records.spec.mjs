import { test, expect, TICK } from './fixtures.mjs';

const startBtn = page => page.getByRole('button', { name: '▶ Start 3D game' });

/** Play on the current settings and hit the wall after eating one apple: a finished game worth 10 points. */
async function finishWithTenPoints(game) {
  await game.press('Space');
  const h = await game.head();
  await game.setFood({ x: h.x + 1, y: h.y, z: h.z });
  await game.run(TICK * 15);
  expect(await game.state()).toBe('over');
}

test.describe('field size', () => {
  test('7 × 7 × 7: centre start, HUD and an earlier wall', async ({ game }) => {
    const { page } = game;
    await page.locator('#size').selectOption('7');
    expect(await page.evaluate(() => window.__snake.size)).toBe(7);
    await expect(page.locator('#overlay')).toContainText('7 × 7 × 7');
    await expect(page.locator('#coords')).toHaveText('X4 Y4 Z4');

    await startBtn(page).click();
    await expect(page.locator('#size')).toBeDisabled();
    await game.run(TICK * 3 + 10); // x 3 -> 6, the last cell
    expect(await game.state()).toBe('playing');
    await game.run(TICK);
    expect(await game.state()).toBe('over');
    await expect(page.locator('#overlay')).toContainText('You hit the cube wall.');
    await expect(page.locator('#size')).toBeEnabled();
  });

  test('size and difficulty are remembered after a reload', async ({ game }) => {
    const { page } = game;
    await page.locator('#size').selectOption('9');
    await page.locator('#difficulty').selectOption('hard');
    await page.reload();
    await game.run(50);
    await expect(page.locator('#size')).toHaveValue('9');
    await expect(page.locator('#difficulty')).toHaveValue('hard');
    expect(await page.evaluate(() => window.__snake.size)).toBe(9);
  });
});

test.describe('records', () => {
  test('a finished game is a new best score and appears in the table', async ({ game }) => {
    const { page } = game;
    await finishWithTenPoints(game);
    const overlay = page.locator('#overlay');
    await expect(overlay).toContainText('🥇 New best score! · Slow · 13 × 13 × 13');
    await expect(page.locator('#best')).toHaveText('10');

    await overlay.getByRole('button', { name: '🏆 Records' }).click();
    await expect(overlay).toContainText('Records 🏆');
    const rows = overlay.locator('table.rec tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first().locator('td.score')).toHaveText('10');
    await expect(rows.first()).toHaveClass(/mine/);

    await overlay.getByRole('button', { name: '7³' }).click();
    await expect(overlay).toContainText('No records yet for Slow · 7 × 7 × 7');

    await overlay.getByRole('button', { name: 'Close' }).click();
    await expect(overlay).toContainText('Game over');
  });

  test('records are kept per difficulty and field size', async ({ game }) => {
    const { page } = game;
    await finishWithTenPoints(game); // Slow · 13
    await page.locator('#difficulty').selectOption('hard');
    await expect(page.locator('#best')).toHaveText('0');
    await page.locator('#difficulty').selectOption('easy');
    await expect(page.locator('#best')).toHaveText('10');
  });

  test('L during a game pauses it and opens the table; Escape and L close it', async ({ game }) => {
    const { page } = game;
    await game.press('Space');
    await game.press('KeyL');
    expect(await game.state()).toBe('paused');
    await expect(page.locator('#overlay')).toContainText('Records 🏆');
    await game.press('KeyL');
    await expect(page.locator('#overlay')).toContainText('Paused');

    await page.locator('#recordsBtn').click();
    await expect(page.locator('#overlay')).toContainText('Records 🏆');
    await game.press('Escape');
    await expect(page.locator('#overlay')).not.toContainText('Records 🏆');
  });

  test('the best score of older versions moves into the Slow · 13 table', async ({ game }) => {
    const { page } = game;
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('snake3d-true-best', '70'); });
    await page.reload();
    await game.run(50);
    await expect(page.locator('#best')).toHaveText('70');
    const stored = await page.evaluate(() => [localStorage.getItem('snake3d-true-best'), JSON.parse(localStorage.getItem('snake3d-records-v1'))]);
    expect(stored[0]).toBeNull();
    expect(stored[1]['easy-13'][0].score).toBe(70);
  });
});
