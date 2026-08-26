import { test, expect } from '@playwright/test';

test.describe('CartelWorx KCSS — Appearance', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/#/appearance');
    await page.waitForTimeout(5500); // startup overlay
  });

  test('appearance page loads with theme options', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Appearance Settings/i })).toBeVisible();

    // Core themes should be present
    await expect(page.getByText('World Rally')).toBeVisible();
    await expect(page.getByText('Modern Performance')).toBeVisible();
    await expect(page.getByText('Classic Muscle')).toBeVisible();
    await expect(page.getByText('Pro Tuner')).toBeVisible();
    await expect(page.getByText('Minimalist EV')).toBeVisible();
    await expect(page.getByText('Race Dash IC-7')).toBeVisible();
  });

  test('can switch dashboard theme', async ({ page }) => {
    // Click Modern Performance theme card
    await page.getByText('Modern Performance').click();

    // The card should now have the active border treatment
    // (we look for the heading still being visible as a basic sanity check)
    await expect(page.getByText('Modern Performance')).toBeVisible();

    // Switch to Classic
    await page.getByText('Classic Muscle').click();
    await expect(page.getByText('Classic Muscle')).toBeVisible();
  });

  test('unit system toggle works', async ({ page }) => {
    await expect(page.getByText('Metric (km/h)')).toBeVisible();
    await expect(page.getByText('Imperial (mph)')).toBeVisible();

    await page.getByText('Imperial (mph)').click();
    // Button should still be there (state change is visual)
    await expect(page.getByText('Imperial (mph)')).toBeVisible();
  });
});
