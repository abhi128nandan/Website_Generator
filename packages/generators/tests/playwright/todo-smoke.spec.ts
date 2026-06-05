import { test, expect } from '@playwright/test';

test.describe('Todo App Functional Smoke Test', () => {
  test('Create, Read, Update, Delete flow', async ({ page }) => {
    // 1. Start application (assuming it's running on localhost:5173)
    // We use localhost:5173 as Vite's default dev server port
    await page.goto('http://localhost:5173');
    
    // Check if the page loaded
    await expect(page.locator('body')).toBeVisible();

    const taskName = `Smoke Test Task ${Date.now()}`;
    const updateName = `${taskName} - Updated`;

    // 2. Create task
    // Using loose locators to accommodate different LLM generations
    const input = page.locator('input').first();
    const submitBtn = page.locator('button[type="submit"], button:has-text("Add"), button:has-text("Create")').first();

    await expect(input).toBeVisible();
    await expect(submitBtn).toBeVisible();

    await input.fill(taskName);
    await submitBtn.click();

    // 3. Verify task appears (Read)
    const taskLocator = page.locator(`text="${taskName}"`);
    await expect(taskLocator).toBeVisible({ timeout: 10000 });

    // 4. Update task (Complete or Edit)
    // Find the container holding the task
    const taskContainer = page.locator(`:has-text("${taskName}")`).locator('..').last();
    
    // Try to toggle complete
    const toggle = taskContainer.locator('input[type="checkbox"], button:has-text("Complete"), button:has-text("Toggle")').first();
    
    if (await toggle.count() > 0 && await toggle.isVisible()) {
      await toggle.click();
      // Wait a moment for update to propagate
      await page.waitForTimeout(500);
    } else {
      // If there's an edit button, try updating the text
      const editBtn = taskContainer.locator('button:has-text("Edit")').first();
      if (await editBtn.count() > 0 && await editBtn.isVisible()) {
        await editBtn.click();
        const editInput = taskContainer.locator('input').first();
        await editInput.fill(updateName);
        const saveBtn = taskContainer.locator('button:has-text("Save"), button:has-text("Update")').first();
        await saveBtn.click();
        
        // Verify update appears
        await expect(page.locator(`text="${updateName}"`)).toBeVisible({ timeout: 5000 });
      }
    }

    // 5. Delete task
    const deleteBtn = taskContainer.locator('button:has-text("Delete"), button:has-text("Remove"), button:has-text("X")').first();
    if (await deleteBtn.count() > 0 && await deleteBtn.isVisible()) {
        await deleteBtn.click();
    } else {
        // Fallback to any delete button on the page that might be for this row
        const fallbackDelete = page.locator('button:has-text("Delete"), button:has-text("Remove")').last();
        await fallbackDelete.click();
    }

    // 6. Verify deletion succeeds
    await expect(page.locator(`text="${updateName}"`)).toBeHidden({ timeout: 5000 });
    await expect(page.locator(`text="${taskName}"`)).toBeHidden({ timeout: 5000 });
  });
});
