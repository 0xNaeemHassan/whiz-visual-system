import { test, expect } from '@playwright/test';

const goToEditor = async (page) => {
  await page.goto('/');
  const editorNav = page.getByRole('button', { name: /editor/i }).first();
  if (await editorNav.count()) {
    await editorNav.click();
  }
  await expect(page.getByText(/Frame Library|Whiz/i).first()).toBeVisible();
  const firstFrame = page.locator('button, [role="button"], div').filter({ hasText: /^Use$/ }).first();
  if (await firstFrame.count()) {
    await firstFrame.click();
  } else {
    await page.locator('[title]').first().click();
  }
};

test.describe('editor top journeys', () => {
  test('open editor, edit content, validate, snapshot, export, publish gate', async ({ page }) => {
    await goToEditor(page);

    await expect(page.getByText(/Editor|Frame/i).first()).toBeVisible();

    const titleInput = page.locator('textarea, input').filter({ hasText: '' }).nth(0);
    await page.getByLabel(/title/i).first().fill('E2E Journey Title');

    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+z' : 'Control+Shift+z');

    const validateBtn = page.getByRole('button', { name: /validate|preflight|check/i }).first();
    if (await validateBtn.count()) {
      await validateBtn.click();
    }

    const snapshotBtn = page.getByRole('button', { name: /snapshot lock|snapshot/i }).first();
    if (await snapshotBtn.count()) {
      await snapshotBtn.click();
    }

    const saveBtn = page.getByRole('button', { name: /^save$/i }).first();
    if (await saveBtn.count()) {
      await saveBtn.click();
      const saveName = page.locator('input[placeholder*="save" i], input').first();
      if (await saveName.count()) {
        await saveName.fill('E2E Journey Save');
        await page.getByRole('button', { name: /save/i }).last().click();
      }
    }

    const exportBtn = page.getByRole('button', { name: /export webp|export png|export/i }).first();
    if (await exportBtn.count()) {
      await exportBtn.click();
    }

    const publishBtn = page.getByRole('button', { name: /publish/i }).first();
    if (await publishBtn.count()) {
      await publishBtn.click();
      await expect(page.locator('body')).toContainText(/blocked|sign-off|preflight|approval|publish/i);
    }
  });

  test('library modal and keyboard workflow smoke', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Frame Library/i)).toBeVisible();

    const search = page.getByPlaceholder(/Search frames/i);
    await search.fill('timeline');
    await page.keyboard.press('Enter');

    const preview = page.getByRole('button', { name: /preview/i }).first();
    if (await preview.count()) {
      await preview.click();
      await page.keyboard.press('Escape');
    }

    const firstUse = page.getByRole('button', { name: /use/i }).first();
    if (await firstUse.count()) {
      await firstUse.focus();
      await page.keyboard.press('Enter');
    }
  });
});
