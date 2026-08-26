import { test, expect } from '@playwright/test';

test.describe('CartelWorx KCSS — Smoke', () => {
  test('app boots, startup overlay fades, dashboard is visible', async ({ page }) => {
    await page.goto('/');

    // Startup overlay should be present initially
    const overlay = page.locator('.animate-startup-sequence');
    await expect(overlay).toBeVisible({ timeout: 3000 });

    // Overlay should disappear after ~5s animation
    await expect(overlay).toBeHidden({ timeout: 8000 });

    // Main shell should be alive
    await expect(page.locator('body')).toBeVisible();

    // Sidebar logo (expanded) should be present on desktop
    await expect(page.getByText('Cartel').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Worx').first()).toBeVisible();
  });

  test('hash router works and root route loads', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForTimeout(5500); // let startup finish

    // We should still be on the root hash route
    expect(page.url()).toContain('#/');
  });
});
