import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Register a test user
  await page.goto('/register');
  
  const timestamp = Date.now();
  const email = `testuser_${timestamp}@example.com`;
  const password = 'TestPassword123';

  await page.getByTestId('email-input').fill(email);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('auth-submit-button').click();

  // Wait for successful registration and redirect
  await page.waitForURL('/', { timeout: 5000 });
  
  // Verify user is logged in by checking for logout button
  await expect(page.getByTestId('logout-button')).toBeVisible({ timeout: 5000 });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
