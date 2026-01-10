/**
 * E2E Critical Path Tests
 * 
 * Philosophy: Test the 3 most important user journeys
 * - Not every edge case (that's for unit/integration tests)
 * - Not implementation details
 * - Just the core flows that MUST work
 */

import { test, expect } from '@playwright/test';

test.describe('Critical User Journey 1: Anonymous User Creates Short URL', () => {
  test('visitor can shorten a URL and use it', async ({ page, context }) => {
    await page.goto('/');
    
    // Fill and submit
    const originalUrl = 'https://playwright.dev';
    await page.getByTestId('url-input').fill(originalUrl);
    await page.getByTestId('shorten-button').click();
    
    // Wait for success message
    await expect(page.getByTestId('success-message')).toBeVisible({ timeout: 5000 });
    
    // Get the newly created short URL link (displayed after success)
    const createdLink = page.getByTestId('created-short-link');
    await expect(createdLink).toBeVisible({ timeout: 5000 });
    
    const shortUrl = await createdLink.getAttribute('href');
    expect(shortUrl).toBeTruthy();
    expect(shortUrl).toMatch(/^http:\/\/localhost:\d+\/\w+$/);
    
    // Verify redirect works
    const newPage = await context.newPage();
    await newPage.goto(shortUrl!);
    await expect(newPage).toHaveURL(originalUrl, { timeout: 5000 });
  });
});

test.describe('Critical User Journey 2: User Registration and Login', () => {
  test('new user can register and login', async ({ page }) => {
    const email = `user${Date.now()}@test.com`;
    const password = 'SecurePass123';
    
    // Register
    await page.goto('/register');
    await page.getByTestId('email-input').fill(email);
    await page.getByTestId('password-input').fill(password);
    await page.getByTestId('auth-submit-button').click();
    
    // Wait for navigation to home page after successful registration
    await page.waitForURL('/', { timeout: 5000 });
    
    // Should be logged in (logout button should be visible)
    await expect(page.getByTestId('logout-button')).toBeVisible({ timeout: 5000 });
    
    // Logout
    await page.getByTestId('logout-button').click();
    
    // Login again
    await page.goto('/login');
    await page.getByTestId('email-input').fill(email);
    await page.getByTestId('password-input').fill(password);
    await page.getByTestId('auth-submit-button').click();
    
    // Wait for navigation to home page
    await page.waitForURL('/', { timeout: 5000 });
    
    // Should be logged in
    await expect(page.getByTestId('logout-button')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Critical User Journey 3: Authenticated User Manages Links', () => {
  // Create a fresh user for this test
  test.beforeEach(async ({ page }) => {
    const email = `auth${Date.now()}@test.com`;
    const password = 'SecurePass123';
    
    await page.goto('/register');
    await page.getByTestId('email-input').fill(email);
    await page.getByTestId('password-input').fill(password);
    await page.getByTestId('auth-submit-button').click();
    
    // Wait for navigation and auth state update
    await page.waitForURL('/', { timeout: 5000 });
    await expect(page.getByTestId('logout-button')).toBeVisible({ timeout: 5000 });
  });

  test('logged-in user can create multiple short URLs', async ({ page }) => {
    await page.goto('/');
    
    const urls = [
      'https://github.com',
      'https://nodejs.org',
    ];
    
    for (const url of urls) {
      await page.getByTestId('url-input').fill(url);
      await page.getByTestId('shorten-button').click();
      
      // Wait for success
      await expect(page.getByTestId('success-message')).toBeVisible({ timeout: 5000 });
    }
    
    // Verify we have at least 2 links
    await page.reload();
    const linkCount = await page.getByTestId('short-link').count();
    expect(linkCount).toBeGreaterThanOrEqual(2);
  });
});
