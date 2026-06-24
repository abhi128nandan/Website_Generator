"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
test_1.test.describe('Generic CRUD Functional Smoke Test', () => {
    (0, test_1.test)('Create, Read, Update, Delete flow', async ({ page }) => {
        // 1. Start application
        await page.goto('http://localhost:5173');
        await (0, test_1.expect)(page.locator('body')).toBeVisible();
        // Look for a link to the main entity list if we are on a dashboard
        // If we see "Go to", "View", or a link that isn't "/", we click it.
        const viewLinks = page.locator('a[href!="/"]').first();
        if (await viewLinks.count() > 0 && await viewLinks.isVisible()) {
            await viewLinks.click();
        }
        // Try finding a "New", "Create", or "Add" button
        const newBtn = page.locator('a:has-text("New"), button:has-text("New"), a:has-text("Create"), button:has-text("Create"), a:has-text("Add"), button:has-text("Add")').first();
        if (await newBtn.count() > 0 && await newBtn.isVisible()) {
            await newBtn.click();
        }
        // 2. Create Entity
        // Find all visible inputs
        const inputs = page.locator('input:visible, textarea:visible');
        const inputCount = await inputs.count();
        const testString = `Smoke_${Date.now()}`;
        const updateString = `${testString}_Updated`;
        if (inputCount > 0) {
            for (let i = 0; i < inputCount; i++) {
                const input = inputs.nth(i);
                const type = await input.getAttribute('type');
                if (type === 'number') {
                    await input.fill('42');
                }
                else if (type === 'email') {
                    await input.fill(`test_${Date.now()}@example.com`);
                }
                else if (type !== 'checkbox' && type !== 'radio' && type !== 'submit') {
                    await input.fill(testString);
                }
            }
            const submitBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first();
            await submitBtn.click();
            await page.waitForTimeout(1000);
        }
        // 3. Verify entity appears
        // We navigate back to list if needed
        const listLink = page.locator('a:has-text("Back"), a:has-text("List")').first();
        if (await listLink.count() > 0 && await listLink.isVisible()) {
            await listLink.click();
        }
        const entityLocator = page.locator(`text="${testString}"`).first();
        // It might not be text exactly, could be in a table cell.
        await (0, test_1.expect)(entityLocator).toBeVisible({ timeout: 5000 });
        // 4. Update entity
        const row = entityLocator.locator('xpath=./ancestor::tr | ./ancestor::li | ./ancestor::div[contains(@class, "card")]').first();
        const editBtn = row.locator('a:has-text("Edit"), button:has-text("Edit")').first();
        if (await editBtn.count() > 0 && await editBtn.isVisible()) {
            await editBtn.click();
            await page.waitForTimeout(500);
            const firstInput = page.locator('input[type="text"]:visible, textarea:visible').first();
            if (await firstInput.count() > 0) {
                await firstInput.fill(updateString);
                const saveBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")').first();
                await saveBtn.click();
                await page.waitForTimeout(1000);
                await (0, test_1.expect)(page.locator(`text="${updateString}"`).first()).toBeVisible({ timeout: 5000 });
            }
        }
        // 5. Delete entity
        const updatedEntity = page.locator(`text="${updateString}"`).first();
        const deleteRow = updatedEntity.locator('xpath=./ancestor::tr | ./ancestor::li | ./ancestor::div[contains(@class, "card")]').first();
        const deleteBtn = deleteRow.locator('button:has-text("Delete"), button:has-text("Remove")').first();
        if (await deleteBtn.count() > 0 && await deleteBtn.isVisible()) {
            await deleteBtn.click();
            await page.waitForTimeout(500);
            // Handle confirm dialogs if any
            page.on('dialog', dialog => dialog.accept());
            await (0, test_1.expect)(page.locator(`text="${updateString}"`).first()).toBeHidden({ timeout: 5000 });
        }
    });
});
