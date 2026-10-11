import { test, expect } from '@playwright/test';

test.describe('REGRESS-06: Actions Taken Flow (Lab 4)', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  test('IT Staff adds, views, and edits Action Taken notes; Requester has read-only access', async ({ page }) => {
    // 1. Login as IT Staff
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/login');

    await page.locator('input[type="email"]').fill('piyanuch.staff@toktickit.dev');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button:has-text("Sign In")').click();

    // Navigate to Staff Queue
    const queueBtn = page.locator('button:has-text("Staff Queue"), a:has-text("Staff Queue")').first();
    await queueBtn.waitFor({ state: 'visible', timeout: 10000 });
    await queueBtn.click();
    await expect(page.getByRole('heading', { name: 'Staff Ticket Queue' })).toBeVisible({ timeout: 10000 });

    // Open first ticket in queue
    const viewBtn = page.locator('button:has-text("View Details")').first();
    await viewBtn.waitFor({ state: 'visible', timeout: 10000 });
    await viewBtn.click();

    // Verify Actions Taken section exists
    await expect(page.getByRole('heading', { name: 'Actions Taken' })).toBeVisible({ timeout: 10000 });

    // Record Action Taken
    const recordBtn = page.locator('button:has-text("Record Action Taken")');
    await expect(recordBtn).toBeVisible();
    await recordBtn.click();

    // Fill form
    const uniqueDesc = `Diagnosed core switch logs - ${Date.now()}`;
    const uniqueResult = `Replaced faulty transceiver module - ${Date.now()}`;
    const followUpNote = 'Monitor ping latency for 24 hours';

    await page.locator('#action-description').fill(uniqueDesc);
    await page.locator('#action-result').fill(uniqueResult);
    await page.locator('#action-followup-req').check();
    await page.locator('#action-followup-note').fill(followUpNote);
    await page.locator('#action-attachment-notes').fill('See switch_syslog.pcap');

    // Submit
    await page.locator('button:has-text("Save Action Taken")').click();

    // Verify newly added action is listed in the table
    await expect(page.getByText(uniqueDesc)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(uniqueResult)).toBeVisible();
    const actionRow = page.locator('tr').filter({ hasText: uniqueDesc });
    await expect(actionRow.getByText('Follow-Up Needed')).toBeVisible();
    await expect(actionRow.getByText(followUpNote)).toBeVisible();

    // Edit the action taken
    const editBtn = actionRow.locator('button:has-text("Edit Action"), button:has-text("Edit")');
    await editBtn.click();

    // Update Result
    const updatedResult = `${uniqueResult} (Verified link stable)`;
    await page.locator('#action-result').fill(updatedResult);
    await page.locator('button:has-text("Save Action Taken")').click();

    // Verify updated result is reflected
    await expect(page.getByText(updatedResult)).toBeVisible({ timeout: 10000 });

    // 2. Role permission check: Logout and login as Requester
    await page.locator('button:has-text("Logout"), a:has-text("Logout")').first().click();
    await expect(page).toHaveURL(/.*login/);

    await page.locator('input[type="email"]').fill('somchai.req@toktickit.dev');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button:has-text("Sign In")').click();

    await expect(page.getByRole('heading', { name: 'My Tickets' })).toBeVisible({ timeout: 10000 });

    // View first ticket
    const requesterViewBtn = page.locator('button:has-text("View")').first();
    await requesterViewBtn.click();

    // Verify Actions Taken is visible (read-only)
    await expect(page.getByRole('heading', { name: 'Actions Taken' })).toBeVisible({ timeout: 10000 });

    // Verify Record and Edit buttons are NOT visible for Requester
    await expect(page.locator('button:has-text("Record Action Taken")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Edit Action")')).not.toBeVisible();
  });
});
