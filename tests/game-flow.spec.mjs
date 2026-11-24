import { test, expect, START_HEAD, TICK } from './fixtures.mjs';

test.describe('pause and restart', () => {
  test('Space pauses and resumes; the snake does not move while paused', async ({ game }) => {
    const { page } = game;
    await game.press('Space');
    await game.press('Space');
    expect(await game.state()).toBe('paused');
    await expect(page.locator('#overlay')).toContainText('Pause');
    await expect(page.locator('#pauseBtn')).toHaveText('Resume');

    const head = await game.head();
    await game.run(TICK * 5);
    expect(await game.head()).toEqual(head);

    await game.press('Space');
    expect(await game.state()).toBe('playing');
    await expect(page.locator('#overlay')).toBeHidden();
    await game.run(TICK + 10);
    expect((await game.head()).x).toBe(head.x + 1);
  });

  test('pause button and the overlay "Resume" button', async ({ game }) => {
    const { page } = game;
    await game.press('Space');
    await page.locator('#pauseBtn').click();
    expect(await game.state()).toBe('paused');
    await page.locator('#overlay').getByRole('button', { name: 'Resume' }).click();
    expect(await game.state()).toBe('playing');
  });

  test('Space after clicking the pause button toggles only once', async ({ game }) => {
    const { page } = game;
    await game.press('Space');
    await page.locator('#pauseBtn').click(); // focus stays on the button
    await game.press('Space');
    expect(await game.state()).toBe('playing');
  });

  test('"Restart" button restarts the game', async ({ game }) => {
    const { page } = game;
    await game.press('Space');
    await game.run(TICK * 2 + 10);
    await page.locator('#restartBtn').click();
    expect(await game.state()).toBe('playing');
    expect(await game.head()).toEqual(START_HEAD);
  });

  test('R restarts: score, length and position are reset', async ({ game }) => {
    const { page } = game;
    await game.press('Space');
    await game.setFood({ x: 7, y: 6, z: 6 });
    await game.run(TICK + 10);
    await expect(page.locator('#score')).toHaveText('10');

    await game.press('KeyR');
    expect(await game.state()).toBe('playing');
    expect(await game.head()).toEqual(START_HEAD);
    await expect(page.locator('#score')).toHaveText('0');
    await expect(page.locator('#len')).toHaveText('4');
    // an interrupted game is not a finished one: it does not enter the records table
    await expect(page.locator('#best')).toHaveText('0');
  });
});

test.describe('eating and game over', () => {
  test('eating an apple grows the snake and adds 10 points', async ({ game }) => {
    const { page } = game;
    await game.press('Space');
    await game.setFood({ x: 7, y: 6, z: 6 });
    await game.run(TICK + 10);
    await expect(page.locator('#score')).toHaveText('10');
    await expect(page.locator('#len')).toHaveText('5');
    await expect(page.locator('#best')).toHaveText('10');
    await expect(page.locator('#toast')).toHaveText('+10');
    expect(await page.evaluate(() => window.__snake.food)).not.toEqual({ x: 7, y: 6, z: 6 });
  });

  test('hitting the wall ends the game; "Play again" starts a new one', async ({ game }) => {
    const { page } = game;
    await game.press('Space');
    await game.run(TICK * 6 + 10);
    expect(await game.state()).toBe('playing');
    expect((await game.head()).x).toBe(12);
    await game.run(TICK);
    expect(await game.state()).toBe('over');
    await expect(page.locator('#overlay')).toContainText('Game over');
    await expect(page.locator('#overlay')).toContainText('You hit the cube wall.');
    await expect(page.locator('#difficulty')).toBeEnabled();

    await page.getByRole('button', { name: '↻ Play again' }).click();
    expect(await game.state()).toBe('playing');
    expect(await game.head()).toEqual(START_HEAD);
  });

  test('biting its own body ends the game', async ({ game }) => {
    const { page } = game;
    await game.press('Space');
    await game.setFood({ x: 7, y: 6, z: 6 });
    await game.run(TICK + 10); // length 5, head at x7
    await game.press('KeyE');      // up
    await game.press('ArrowLeft'); // -x
    await game.press('KeyQ');      // down, into its own body
    expect(await game.state()).toBe('over');
    await expect(page.locator('#overlay')).toContainText('The snake bit itself.');
  });

  test('best score survives a reload', async ({ game }) => {
    const { page } = game;
    await game.press('Space');
    await game.setFood({ x: 7, y: 6, z: 6 });
    await game.run(TICK * 7);
    expect(await game.state()).toBe('over');
    await page.reload();
    await game.run(50);
    await expect(page.locator('#best')).toHaveText('10');
  });
});
