import { test, expect, START_HEAD } from './fixtures.mjs';

// Default camera: forward is -z, right is +x; the snake starts heading +x.
const CASES = [
  { keys: ['KeyE', 'PageUp'], delta: { x: 0, y: 1, z: 0 }, name: 'up' },
  { keys: ['KeyQ', 'PageDown'], delta: { x: 0, y: -1, z: 0 }, name: 'down' },
  { keys: ['ArrowUp', 'KeyW'], delta: { x: 0, y: 0, z: -1 }, name: 'forward' },
  { keys: ['ArrowDown', 'KeyS'], delta: { x: 0, y: 0, z: 1 }, name: 'back' },
  { keys: ['ArrowRight', 'KeyD'], delta: { x: 1, y: 0, z: 0 }, name: 'current direction = extra step' },
  { keys: ['ArrowLeft', 'KeyA'], delta: { x: 0, y: 0, z: 0 }, name: 'reverse into the neck is ignored' },
];

test.describe('keyboard controls', () => {
  for (const { keys, delta, name } of CASES) {
    for (const key of keys) {
      test(`${key} on the start screen: starts the game, ${name}`, async ({ game }) => {
        await game.press(key);
        expect(await game.state()).toBe('playing');
        expect(await game.head()).toEqual({ x: START_HEAD.x + delta.x, y: START_HEAD.y + delta.y, z: START_HEAD.z + delta.z });
      });
    }
  }

  test('a turn takes effect within 70 ms, not on the next 420 ms tick', async ({ game }) => {
    await game.press('Space');
    await game.run(420 + 100); // one regular tick: x 6 -> 7
    expect(await game.head()).toEqual({ x: 7, y: 6, z: 6 });
    await game.press('KeyE');
    expect(await game.head()).toEqual({ x: 7, y: 7, z: 6 });
  });

  test('tapping the current direction speeds the snake up', async ({ game }) => {
    await game.press('Space');
    for (let i = 0; i < 4; i++) { await game.page.keyboard.press('ArrowRight'); await game.run(150); }
    // 600 ms without input = 1 tick; with taps the head moved at least 3 cells
    expect((await game.head()).x - START_HEAD.x).toBeGreaterThanOrEqual(3);
  });

  test('works in the Ukrainian layout when the device reports no key code', async ({ game }) => {
    await game.press('Space');
    await game.page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'у', bubbles: true })));
    await game.run(70);
    expect(await game.head()).toEqual({ x: 6, y: 7, z: 6 });
  });

  test('on-screen buttons steer the snake', async ({ game }) => {
    await game.page.getByRole('button', { name: 'Up along Y' }).dispatchEvent('pointerdown');
    await game.run(70);
    expect(await game.head()).toEqual({ x: 6, y: 7, z: 6 });
  });
});
