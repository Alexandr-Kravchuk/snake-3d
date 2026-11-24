import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1, // keeps the game's adaptive pixel ratio fixed at 1
    trace: 'retain-on-failure',
    launchOptions: {
      // SLOWMO=400 npx playwright test --headed --workers=1 — watch every action in a visible browser
      slowMo: Number(process.env.SLOWMO) || 0,
      // Software WebGL (SwiftShader): same pixels on every run, independent of the GPU
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    },
  },
  // WebGL frames shift by a sub-frame phase of the fake clock (~0.01% of pixels); 1% still catches real visual changes
  // A fake-clock frame phase shifts the snake by a fraction of a cell: up to ~140 px of noise was measured over 20 runs
  expect: { toHaveScreenshot: { maxDiffPixels: 300 } },
});
