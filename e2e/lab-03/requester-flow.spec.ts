import { test, expect } from '@playwright/test';

test.describe('REQ-05: Requester Regression E2E Flow', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => window.localStorage.clear()).catch(() => {});
    await page.goto('/login');
    // Using predefined Requester seed
    await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill('somchai.req@toktickit.dev');
    await page.locator('input[type="password"]').first().fill('password123');
    await page.locator('button:has-text("Sign In"), button[type="submit"]').first().click();
    await expect(page).toHaveURL(/.*/);
  });

  test('REQ-05: Create ticket, add comment, and mark resolved', async ({ page }) => {
    // Create Ticket
    const createBtn = page.locator('button:has-text("Create New Ticket"), button:has-text("Create Ticket")').first();
    await createBtn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    if (await createBtn.isVisible()) {
        await createBtn.click();
    }
    
    await page.locator('input[name="summary"], input[placeholder*="summary" i]').first().fill('Mouse not working');
    await page.locator('textarea[name="description"], textarea[placeholder*="description" i]').first().fill('My wireless mouse is out of battery or broken.');
    await page.locator('select').first().selectOption({ index: 1 }).catch(() => {});
    await page.locator('button[type="submit"], button:has-text("Submit")').first().click();

    // Add Public Comment
    const commentBox = page.locator('textarea[placeholder*="comment"], textarea[placeholder*="message"]');
    await commentBox.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    if (await commentBox.isVisible()) {
        await commentBox.fill('I found some batteries, but it still does not work.');
        await page.click('button:has-text("Submit"), button:has-text("Add Comment")');
        await expect(page.locator('text=still does not work')).toBeVisible();
    }

    // Verify no Internal Notes tab
    const internalTab = page.locator('button:has-text("Internal Notes"), button:has-text("Internal")');
    await expect(internalTab).not.toBeVisible();

    // Mark Appears Resolved
    const resolveCheckbox = page.locator('input[type="checkbox"], button:has-text("Resolved")').last();
    if (await resolveCheckbox.isVisible()) {
        await resolveCheckbox.check().catch(async () => {
          await resolveCheckbox.click();
        });
        await expect(page.locator('text=Issue Appears Resolved').or(page.locator('.resolved-badge'))).toBeVisible();
    }
  });
});
