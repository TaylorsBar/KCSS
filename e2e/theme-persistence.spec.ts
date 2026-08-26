import { test, expect } from '@playwright/test';

test.describe('CartelWorx KCSS — Theme Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  test('selected theme survives a full reload', async ({ page }) => {
    await page.goto('/#/appearance');
    await page.waitForTimeout(5500);

    // Switch to Classic Muscle
    await page.getByText('Classic Muscle').click();
    await expect(page.getByText('Classic Muscle')).toBeVisible();

    // Confirm localStorage was written
    const themeBefore = await page.evaluate(() => localStorage.getItem('vehicle-theme'));
    expect(themeBefore).toBe('classic');

    // Hard reload
    await page.reload();
    await page.waitForTimeout(5500);

    // Still on appearance or navigate back
    await page.goto('/#/appearance');
    await page.waitForTimeout(1000);

    const themeAfter = await page.evaluate(() => localStorage.getItem('vehicle-theme'));
    expect(themeAfter).toBe('classic');

    // data-theme attribute should also reflect it
    const dataTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(dataTheme).toBe('classic');
  });

  test('unit system persists across reload', async ({ page }) => {
    await page.goto('/#/appearance');
    await page.waitForTimeout(5500);

    await page.getByText('Imperial (mph)').click();

    const unitsBefore = await page.evaluate(() => localStorage.getItem('vehicle-unit-system'));
    expect(unitsBefore).toBe('imperial');

    await page.reload();
    await page.waitForTimeout(5500);
    await page.goto('/#/appearance');
    await page.waitForTimeout(800);

    const unitsAfter = await page.evaluate(() => localStorage.getItem('vehicle-unit-system'));
    expect(unitsAfter).toBe('imperial');
  });

  test('can switch themes multiple times and last one wins', async ({ page }) => {
    await page.goto('/#/appearance');
    await page.waitForTimeout(5500);

    await page.getByText('Modern Performance').click();
    await page.getByText('Pro Tuner').click();
    await page.getByText('Minimalist EV').click();

    const theme = await page.evaluate(() => localStorage.getItem('vehicle-theme'));
    expect(theme).toBe('minimalist');

    await page.reload();
    await page.waitForTimeout(5500);

    const themeAfter = await page.evaluate(() => localStorage.getItem('vehicle-theme'));
    expect(themeAfter).toBe('minimalist');
  });
});
