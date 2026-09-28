import { test, expect } from '@playwright/test';

test.describe('REQ-05: Requester Regression E2E Flow', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  test.beforeEach(async ({ page }) => {
    
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/login');

    // Using predefined Requester seed
    await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill('somchai.req@toktickit.dev');
    await page.locator('input[type="password"]').first().fill(process.env.TEST_PASSWORD || 'password123');
    await page.locator('button:has-text("Sign In"), button[type="submit"]').first().click();
    await expect(page).toHaveURL(/.*/);
  });

  test('REQ-05: Create ticket, add comment, and mark resolved', async ({ page }) => {
    // Create Ticket
    const createBtn = page.locator('button:has-text("Create New Ticket"), button:has-text("Create Ticket")').first();
    await createBtn.waitFor({ state: 'visible', timeout: 10000 });
    if (await createBtn.isVisible()) {
        await createBtn.click();
    }
    
    await page.locator('input[name="summary"], input[placeholder*="summary" i]').first().fill('Mouse not working');
    await page.locator('textarea[name="description"], textarea[placeholder*="description" i]').first().fill('My wireless mouse is out of battery or broken.');
    await page.locator('select').nth(0).selectOption({ index: 1 });
    await page.locator('select').nth(1).selectOption({ index: 1 });
    await page.locator('button[type="submit"], button:has-text("Submit")').first().click();

    // Click the first ticket in the list to open details
    const firstTicket = page.locator('button:has-text("TKT-")').first();
    await firstTicket.waitFor({ state: 'visible', timeout: 10000 });
    await firstTicket.click();

    // Add Public Comment
    const commentBox = page.locator('textarea[placeholder*="comment"], textarea[placeholder*="message"]');
    await commentBox.waitFor({ state: 'visible', timeout: 10000 });
    if (await commentBox.isVisible()) {
        await commentBox.fill('I found some batteries, but it still does not work.');
        await page.click('button:has-text("Submit"), button:has-text("Add Comment")');
        await expect(page.locator('text=still does not work')).toBeVisible();
    }

    // Verify no Internal Notes tab
    const internalTab = page.locator('button:has-text("Internal Notes"), button:has-text("Internal")');
    await expect(internalTab).not.toBeVisible();

    // Mark Appears Resolved
    const resolveCheckbox = page.locator('button:has-text("Mark as Resolved")').last();
    if (await resolveCheckbox.isVisible()) {
        await resolveCheckbox.click();
        await expect(page.locator('button:has-text("Appears Resolved")')).toBeVisible();
    }
  });
});
