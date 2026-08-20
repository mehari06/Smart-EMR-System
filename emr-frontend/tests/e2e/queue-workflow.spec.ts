import { test, expect } from '@playwright/test';

test.describe('Queue Management Workflow', () => {
  test('nurse can view queue and see patients', async ({ page }) => {
    // Login as nurse
    await page.goto('/login');
    await page.fill('input[type="email"]', 'nurse@test.com');
    await page.fill('input[type="password"]', 'Nurse@123');
    await Promise.all([
      page.waitForURL('**/dashboard'),
      page.click('button[type="submit"]'),
    ]);

    // Navigate to Queue
    await page.click('text=Queue');

    // Verify queue page
    await expect(page.locator('h1')).toContainText('Patient Queue');

    // Check for key elements
    await expect(page.getByText('Total Waiting')).toBeVisible();
    await expect(page.getByText('Add to Queue')).toBeVisible();
  });
});