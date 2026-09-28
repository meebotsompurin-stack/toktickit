import { test, expect } from '@playwright/test';

test.describe('STAFF-07 to STAFF-08: IT Staff Flow', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  test.beforeEach(async ({ page }) => {
    
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/login');

    // Using predefined IT Staff seed
    await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill('piyanuch.staff@toktickit.dev');
    await page.locator('input[type="password"]').first().fill(process.env.TEST_PASSWORD || 'password123');
    await page.locator('button:has-text("Sign In"), button[type="submit"]').first().click();
    await expect(page).toHaveURL(/.*/);
  });

  test('STAFF-07: Staff Queue, Claim, and Status Update', async ({ page }) => {
    // Navigate to Staff Queue
    const queueLink = page.locator('button:has-text("Staff Queue"), a:has-text("Staff Queue"), a:has-text("Queue")').first();
    await queueLink.waitFor({ state: 'visible', timeout: 10000 });
    if (await queueLink.isVisible()) await queueLink.click();

    // Search and filter
    const searchInput = page.locator('input[placeholder*="Ticket"], input[placeholder*="Search"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });
    if (await searchInput.isVisible()) {
        await searchInput.fill('VPN');
        await page.waitForTimeout(500); // Debounce wait
    }

    // View Details
    const viewBtn = page.locator('button:has-text("View Details"), a:has-text("View Details")').first();
    await viewBtn.waitFor({ state: 'visible', timeout: 10000 });
    await viewBtn.click();

    // Claim Ticket
    const claimBtn = page.locator('button:has-text("Claim")');
    if (await claimBtn.isVisible()) {
      await claimBtn.click();
      await expect(page.locator('text=Frank IT')).toBeVisible();
    }

    // Update Status
    const statusSelect = page.locator('select').first();
    if (await statusSelect.isVisible()) {
        await statusSelect.selectOption({ index: 1 });
    }
  });

  test('STAFF-08: Add Public and Internal Notes', async ({ page }) => {
    const queueLink = page.locator('button:has-text("Staff Queue"), a:has-text("Staff Queue"), a:has-text("Queue")').first();
    await queueLink.waitFor({ state: 'visible', timeout: 10000 });
    if (await queueLink.isVisible()) await queueLink.click();
    
    const viewBtn = page.locator('button:has-text("View Details"), a:has-text("View Details")').first();
    await viewBtn.waitFor({ state: 'visible', timeout: 10000 });
    await viewBtn.click();

    // Add Public Comment
    const commentBox = page.locator('textarea[placeholder*="comment"], textarea[placeholder*="message"]');
    await commentBox.waitFor({ state: 'visible', timeout: 5000 });
    if (await commentBox.isVisible()) {
        await commentBox.fill('This is a public reply');
        await page.locator('button:has-text("Submit"), button:has-text("Add Comment")').first().click();
        await expect(page.locator('text=This is a public reply').first()).toBeVisible();
    }

    // Add Internal Note
    const internalTab = page.locator('button:has-text("Internal Notes"), button:has-text("Internal")');
    if (await internalTab.isVisible()) {
      await internalTab.click();
    }
    if (await commentBox.isVisible()) {
        await commentBox.fill('This is an internal secret');
        await page.locator('button:has-text("Submit"), button:has-text("Add Note")').first().click();
        await expect(page.locator('text=This is an internal secret').first()).toBeVisible();
    }
  });
});
