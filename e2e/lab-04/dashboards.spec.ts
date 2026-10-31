import { test, expect } from '@playwright/test';

test.describe('REGRESS-08: Dashboards & Drill-Down Filtering Flow (Lab 4)', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  test('IT Staff Dashboard displays operational metrics and performs filter drill-downs', async ({ page }) => {
    // ═════════════════════════════════════════════════════════════════
    // 1. IT Staff Dashboard & Drill-Downs
    // ═════════════════════════════════════════════════════════════════
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/login');

    await page.locator('input[type="email"]').fill('piyanuch.staff@toktickit.dev');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button:has-text("Sign In")').click();

    // Click Dashboard in navbar
    const dashNav = page.locator('button:has-text("Dashboard")').first();
    await dashNav.waitFor({ state: 'visible', timeout: 10000 });
    await dashNav.click();

    // Verify IT Operational Dashboard is rendered
    await expect(page.getByRole('heading', { name: 'IT Operational Dashboard' })).toBeVisible({ timeout: 10000 });

    // Verify 4 operational metric cards exist
    await expect(page.getByText('Unassigned Tickets')).toBeVisible();
    await expect(page.getByText('Owned by Me')).toBeVisible();
    await expect(page.getByText('Recently Updated (7d)')).toBeVisible();
    await expect(page.getByText('Critical Priority')).toBeVisible();

    // Verify Admin metric card is NOT shown to IT Staff
    await expect(page.getByText('TOTAL USER ACCOUNTS')).not.toBeVisible();

    // ─── Drill-Down 1: Unassigned Tickets ───
    await page.locator('button:has-text("View Queue")').first().click();
    await expect(page.getByRole('heading', { name: 'Staff Ticket Queue' })).toBeVisible({ timeout: 10000 });
    
    // Verify Owner filter is pre-selected to "unassigned"
    const ownerSelect = page.locator('div:has(> label:has-text("Owner")) select');
    await expect(ownerSelect).toHaveValue('unassigned');

    // Return to Dashboard
    await page.locator('button:has-text("Dashboard")').first().click();
    await expect(page.getByRole('heading', { name: 'IT Operational Dashboard' })).toBeVisible({ timeout: 10000 });

    // ─── Drill-Down 2: Critical Priority ───
    await page.locator('button:has-text("View Critical")').first().click();
    await expect(page.getByRole('heading', { name: 'Staff Ticket Queue' })).toBeVisible({ timeout: 10000 });

    // Verify IT Priority filter is pre-selected to "CRITICAL"
    const prioritySelect = page.locator('div:has(> label:has-text("IT Priority")) select');
    await expect(prioritySelect).toHaveValue('CRITICAL');

    // Return to Dashboard
    await page.locator('button:has-text("Dashboard")').first().click();
    await expect(page.getByRole('heading', { name: 'IT Operational Dashboard' })).toBeVisible({ timeout: 10000 });

    // ─── Drill-Down 3: Recently Updated (7d) ───
    await page.locator('button:has-text("View Active")').first().click();
    await expect(page.getByRole('heading', { name: 'Staff Ticket Queue' })).toBeVisible({ timeout: 10000 });

    // Verify Recently Updated active filter badge appears
    await expect(page.getByText('Filtered by: Recently Updated (Last 7 Days)')).toBeVisible();
  });

  test('Administrator Dashboard displays Admin variant with Total User Accounts card', async ({ page }) => {
    // ═════════════════════════════════════════════════════════════════
    // 2. Administrator Dashboard & User Management Shortcut
    // ═════════════════════════════════════════════════════════════════
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/login');

    await page.locator('input[type="email"]').fill('admin@toktickit.dev');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button:has-text("Sign In")').click();

    // Click Dashboard in navbar
    const dashNav = page.locator('button:has-text("Dashboard")').first();
    await dashNav.waitFor({ state: 'visible', timeout: 10000 });
    await dashNav.click();

    // Verify Administrator Dashboard header
    await expect(page.getByRole('heading', { name: 'Administrator Dashboard' })).toBeVisible({ timeout: 10000 });

    // Verify the 5th Admin Metric Card is present
    const userCard = page.locator('div').filter({ hasText: /^TOTAL USER ACCOUNTS/ }).first();
    await expect(userCard).toBeVisible({ timeout: 10000 });

    // Click the TOTAL USER ACCOUNTS card to navigate to User Management
    await userCard.click();

    // Verify navigation to User Management page
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: '+ Create User' })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });
});
