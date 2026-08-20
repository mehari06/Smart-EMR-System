import { test, expect } from '@playwright/test';

test.describe('Lab Results Workflow', () => {
  test('patient can view lab results page', async ({ page }) => {
    // Login as patient
    await page.goto('/login');
    await page.fill('input[type="email"]', 'patient@test.com');
    await page.fill('input[type="password"]', 'Patient@123');
    await Promise.all([
      page.waitForURL('**/dashboard'),
      page.click('button[type="submit"]'),
    ]);

    // Navigate to Lab Results
    await page.click('text=Lab Results');

    // Verify lab results page
    await expect(page.locator('h1')).toContainText('Lab Results');
  });
});