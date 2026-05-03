import { test, expect } from '@playwright/test';

const canonicalRoutes = [
  { name: 'dashboard', hash: '#/dashboard' },
  { name: 'library', hash: '#/library' },
  { name: 'editor', hash: '#/editor' },
  { name: 'docs', hash: '#/docs' },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.id = 'visual-deterministic-fonts';
    style.textContent = `
      * {
        font-family: Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        animation: none !important;
        transition: none !important;
      }
      html { scroll-behavior: auto !important; }
    `;
    document.head.appendChild(style);

    const fixedNow = Date.parse('2026-01-15T12:00:00.000Z');
    Date.now = () => fixedNow;
  });
});

for (const route of canonicalRoutes) {
  test(`canonical render: ${route.name}`, async ({ page }) => {
    await page.goto(`/${route.hash}`);
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot(`${route.name}.png`, {
      fullPage: true,
      scale: 'css',
    });
  });
}
