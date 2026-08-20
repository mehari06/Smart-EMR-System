import { test, expect } from '@playwright/test';

test.describe('Appointment Scheduling Workflow', () => {
  test('receptionist can view appointments page', async ({ page }) => {
    // Login as receptionist
    await page.goto('/login');
    await page.fill('input[type="email"]', 'receptionist@test.com');
    await page.fill('input[type="password"]', 'Recept@123');
    await Promise.all([
      page.waitForURL('**/dashboard'),
      page.click('button[type="submit"]'),
    ]);

    // Navigate to Appointments
    await page.click('text=Appointments');

    // Verify appointments page
    await expect(page.locator('h1')).toContainText('Appointments');

    // Check for New Appointment button
    await expect(page.getByText('New Appointment')).toBeVisible();
  });
});