import { test, expect } from '@playwright/test';

test.describe('REGRESS-07: Ticket Resolution & Status Transitions Flow (Lab 4)', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  test('Permitted status transitions, Requester advisory resolution, and conflict handling', async ({ page }) => {
    // ═════════════════════════════════════════════════════════════════
    // 1. IT Staff: Permitted Status Transitions (RBAC State Machine)
    // ═════════════════════════════════════════════════════════════════
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

    // Open an OPEN ticket (e.g. TKT-0102)
    const openTicketRow = page.locator('tr').filter({ hasText: 'TKT-0102' });
    if (await openTicketRow.isVisible()) {
      await openTicketRow.locator('button:has-text("View Details")').click();
    } else {
      await page.locator('button:has-text("View Details")').first().click();
    }

    // Verify status select dropdown is present for IT Staff
    const statusSelect = page.locator('#ticket-status-select');
    await expect(statusSelect).toBeVisible({ timeout: 10000 });

    // Verify permitted options
    const currentStatus = await statusSelect.inputValue();
    const allOptions = await statusSelect.locator('option').allInnerTexts();

    // Verify that illegal jumps are disallowed:
    // e.g. An OPEN or IN_PROGRESS ticket cannot jump straight to CLOSED (only RESOLVED can transition to CLOSED)
    if (currentStatus === 'OPEN' || currentStatus === 'IN_PROGRESS' || currentStatus === 'NEW') {
      expect(allOptions).not.toContain('CLOSED');
    }

    // Update status to a permitted status
    const targetStatus = allOptions.find(opt => opt !== currentStatus);
    if (targetStatus) {
      await statusSelect.selectOption(targetStatus);
      await expect(statusSelect).toHaveValue(targetStatus);
    }

    // ═════════════════════════════════════════════════════════════════
    // 2. Conflict Handling (HTTP 409 Concurrency)
    // ═════════════════════════════════════════════════════════════════
    // Mock 409 Conflict response on status change
    await page.route('**/api/staff/tickets/*/status', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Concurrent modification conflict: version mismatch' }),
      });
    });

    // Attempt a status change that triggers the 409
    const remainingOptions = await statusSelect.locator('option').allInnerTexts();
    const conflictTarget = remainingOptions.find(opt => opt !== targetStatus) || remainingOptions[0];
    await statusSelect.selectOption(conflictTarget);

    // Verify the HTTP 409 conflict alert banner appears
    const conflictAlert = page.locator('div[role="alert"]').filter({ hasText: 'Concurrent Update Conflict' });
    await expect(conflictAlert).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Concurrent Update Conflict \(HTTP 409\)/i)).toBeVisible();

    // Unroute before clicking Refresh
    await page.unroute('**/api/staff/tickets/*/status');

    // Click Refresh on the conflict banner to reload ticket
    const refreshBtn = conflictAlert.locator('button:has-text("Refresh")');
    await refreshBtn.click();
    await expect(conflictAlert).not.toBeVisible();

    // ═════════════════════════════════════════════════════════════════
    // 3. Requester: Advisory "Mark as Resolved" Toggle Flow
    // ═════════════════════════════════════════════════════════════════
    await page.locator('button:has-text("Logout"), a:has-text("Logout")').first().click();
    await expect(page).toHaveURL(/.*login/);

    await page.locator('input[type="email"]').fill('somchai.req@toktickit.dev');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button:has-text("Sign In")').click();

    await expect(page.getByRole('heading', { name: 'My Tickets' })).toBeVisible({ timeout: 10000 });

    // Open first ticket
    await page.locator('button:has-text("View")').first().click();

    // Verify Requester DOES NOT have the editable status dropdown
    await expect(page.locator('#ticket-status-select')).not.toBeVisible();

    // Test Advisory "Mark as Resolved" button
    const resolveBtn = page.locator('button:has-text("Mark as Resolved"), button:has-text("Appears Resolved")').first();
    await expect(resolveBtn).toBeVisible({ timeout: 10000 });

    const initialText = await resolveBtn.innerText();
    await resolveBtn.click();

    // After click, verify button state toggled
    if (initialText.includes('Mark as Resolved')) {
      await expect(page.locator('button:has-text("Appears Resolved")')).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page.locator('button:has-text("Mark as Resolved")')).toBeVisible({ timeout: 10000 });
    }
  });
});
