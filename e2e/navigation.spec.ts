import { test, expect } from '@playwright/test';

test.describe('CartelWorx KCSS — Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait out the 5s startup sequence
    await page.waitForTimeout(5500);
  });

  test('sidebar navigation reaches key pages', async ({ page }) => {
    // Desktop sidebar is hidden on mobile, so force a desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    const routes = [
      { name: 'Diagnostics', hash: '#/diagnostics' },
      { name: 'Tuning', hash: '#/tuning' },
      { name: 'Appearance', hash: '#/appearance' },
      { name: 'Race Pack', hash: '#/race-pack' },
      { name: 'AI Engine', hash: '#/ai-engine' },
    ];

    for (const route of routes) {
      await page.getByRole('link', { name: route.name }).click();
      await expect(page).toHaveURL(new RegExp(route.hash.replace('/', '\\/')));
      // Give the page a moment to render
      await page.waitForTimeout(400);
    }
  });

  test('can collapse and expand the sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const toggle = page.getByRole('button', { name: /collapse sidebar|expand sidebar/i });
    await expect(toggle).toBeVisible();

    // Collapse
    await toggle.click();
    await expect(page.getByRole('button', { name: /expand sidebar/i })).toBeVisible();

    // Expand again
    await toggle.click();
    await expect(page.getByRole('button', { name: /collapse sidebar/i })).toBeVisible();
  });
});
