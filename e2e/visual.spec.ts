import { test, expect } from '@playwright/test';

test.describe('CartelWorx KCSS — Visual Regression', () => {
  // Only run visual tests on the desktop chromium project to keep baselines clean
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'Desktop Chromium only');

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForTimeout(5500); // let startup overlay finish
  });

  test('dashboard visual baseline', async ({ page }) => {
    // Give gauges a moment to settle
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('dashboard-rally.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.03,
    });
  });

  test('appearance page visual baseline', async ({ page }) => {
    await page.goto('/#/appearance');
    await page.waitForTimeout(1000);
    await expect(page.getByRole('heading', { name: /Appearance Settings/i })).toBeVisible();

    await expect(page).toHaveScreenshot('appearance-page.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.03,
    });
  });

  test('diagnostics page visual baseline', async ({ page }) => {
    await page.goto('/#/diagnostics');
    await page.waitForTimeout(1200);

    await expect(page).toHaveScreenshot('diagnostics-page.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.03,
    });
  });

  test('theme switch changes visual surface', async ({ page }) => {
    await page.goto('/#/appearance');
    await page.waitForTimeout(800);

    await page.getByText('Haltech').or(page.getByText('Pro Tuner')).first().click();
    await page.waitForTimeout(400);

    // Go back to dashboard to capture the new look
    await page.goto('/#/');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('dashboard-haltech.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.04,
    });
  });
});
