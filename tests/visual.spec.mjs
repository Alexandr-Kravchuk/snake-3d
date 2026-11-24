import { test, expect } from './fixtures.mjs';

// A locator screenshot waits for the element to be "stable" via requestAnimationFrame,
// which never fires while the fake clock is paused, so shoot the page clipped to #stage.
// Software WebGL + the overlay's backdrop blur make a screenshot take several seconds under parallel load.
const shootStage = async (page, name) =>
  expect(page).toHaveScreenshot(name, { clip: await page.locator('#stage').boundingBox(), timeout: 20_000 });

// Baselines depend on the OS and the WebGL renderer (SwiftShader, see playwright.config.mjs).
// Update after intended visual changes: npm run test:update
test.describe('canvas screenshots', () => {
  test('gameplay frame', async ({ game }) => {
    const { page } = game;
    await game.press('Space');
    await game.setFood({ x: 9, y: 8, z: 4 });
    await game.press('KeyE');
    await game.run(600);
    await shootStage(page, 'gameplay.png');
  });

  test('game over screen', async ({ game }) => {
    const { page } = game;
    await game.press('Space');
    await game.setFood({ x: 9, y: 8, z: 4 });
    await game.run(420 * 7 + 2000); // wall hit, particles settle
    await shootStage(page, 'game-over.png');
  });
});
