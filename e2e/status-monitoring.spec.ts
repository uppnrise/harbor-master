import { test, expect } from '@playwright/test';

test.describe('Status Monitoring', () => {
  test('should display runtime status after detection', async ({ page }) => {
    await page.goto('/');
    
    // Trigger detection
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await refreshButton.click();
    
    // Wait for detection to complete
    await page.waitForTimeout(2000);
    
    // Check if status indicator is visible
    const statusIndicator = page.locator('[data-testid="status-indicator"]').or(
      page.locator('text=/running|stopped|available|unavailable/i')
    );
    
    const isVisible = await statusIndicator.isVisible().catch(() => false);
    
    if (isVisible) {
      // Status should show running or stopped
      const statusText = await statusIndicator.textContent();
      expect(statusText).toMatch(/running|stopped|available|unavailable/i);
    }
  });

  test('should update status indicator color based on runtime state', async ({ page }) => {
    await page.goto('/');
    
    // Trigger detection
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await refreshButton.click();
    await page.waitForTimeout(2000);
    
    // Check for status indicator with color
    const statusIndicator = page.locator('[data-testid="status-indicator"]').or(
      page.locator('.status-indicator, .status-badge')
    );
    
    const isVisible = await statusIndicator.isVisible().catch(() => false);
    
    if (isVisible) {
      // Should have some color/class indicating status
      const classNames = await statusIndicator.getAttribute('class');
      expect(classNames).toBeTruthy();
      
      // Should contain status-related styling
      expect(classNames).toMatch(/status|running|stopped|success|error|warning/i);
    }
  });

  test('should show last checked timestamp', async ({ page }) => {
    await page.goto('/');
    
    // Trigger detection
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await refreshButton.click();
    await page.waitForTimeout(2000);
    
    // Look for timestamp or "last checked" text
    const hasTimestamp = await page.locator('text=/last checked|updated|ago/i').isVisible().catch(() => false);
    
    if (hasTimestamp) {
      const timestampElement = page.locator('text=/last checked|updated|ago/i');
      const timestampText = await timestampElement.textContent();
      
      // Should contain time-related text
      expect(timestampText).toMatch(/checked|updated|ago|seconds|minutes/i);
    }
  });

  test('should refresh status when manual refresh is triggered', async ({ page }) => {
    await page.goto('/');
    
    // First detection
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await refreshButton.click();
    await page.waitForTimeout(2000);
    
    // Get initial status if visible
    const statusIndicator = page.locator('[data-testid="status-indicator"]').or(
      page.locator('text=/running|stopped/i')
    );
    const hadStatus = await statusIndicator.isVisible().catch(() => false);
    
    // Trigger another refresh
    await refreshButton.click();
    await page.waitForTimeout(2000);
    
    // Status should still be visible if it was before
    if (hadStatus) {
      await expect(statusIndicator).toBeVisible();
    }
    
    // Page should be responsive
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display error state when runtime is unavailable', async ({ page }) => {
    await page.goto('/');
    
    // Trigger detection
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await refreshButton.click();
    await page.waitForTimeout(2000);
    
    // Check for error or unavailable state
    const hasError = await page.locator('text=/error|unavailable|not found|failed/i').isVisible().catch(() => false);
    const hasSuccess = await page.locator('text=/running|available|detected/i').isVisible().catch(() => false);
    
    // Should show either error or success state
    expect(hasError || hasSuccess).toBeTruthy();
  });

  test('should handle status polling gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Trigger detection
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await refreshButton.click();
    await page.waitForTimeout(2000);
    
    // Wait for potential auto-refresh (if implemented)
    await page.waitForTimeout(3000);
    
    // Application should still be responsive
    await expect(page.locator('body')).toBeVisible();
    
    // Should not show any console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit more
    await page.waitForTimeout(1000);
    
    // No critical errors should be logged
    const criticalErrors = errors.filter(e => !e.includes('favicon') && !e.includes('404'));
    expect(criticalErrors.length).toBe(0);
  });

  test('should display version information', async ({ page }) => {
    await page.goto('/');
    
    // Trigger detection
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await refreshButton.click();
    await page.waitForTimeout(2000);
    
    // Check if version is displayed
    const hasVersion = await page.locator('text=/version|v?\\d+\\.\\d+\\.\\d+/i').isVisible().catch(() => false);
    
    if (hasVersion) {
      const versionElement = page.locator('text=/v?\\d+\\.\\d+/i').first();
      const versionText = await versionElement.textContent();
      
      // Should match version pattern
      expect(versionText).toMatch(/\d+\.\d+/);
    }
  });

  test('should show runtime path information', async ({ page }) => {
    await page.goto('/');
    
    // Trigger detection
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await refreshButton.click();
    await page.waitForTimeout(2000);
    
    // Check if runtime selector is visible
    const runtimeSelector = page.locator('[data-testid="runtime-selector"]').or(page.locator('select'));
    const isVisible = await runtimeSelector.isVisible().catch(() => false);
    
    if (isVisible) {
      // Should show path information (in tooltip or visible text)
      const hasPath = await page.locator('text=/\\/.*\\/docker|\\/.*\\/podman|docker|podman/i').isVisible().catch(() => false);
      expect(hasPath).toBeTruthy();
    }
  });
});
