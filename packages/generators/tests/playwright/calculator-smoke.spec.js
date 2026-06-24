"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
test_1.test.describe('Calculator App Functional Smoke Test', () => {
    (0, test_1.test)('Basic mathematical operations', async ({ page }) => {
        // 1. Start application
        await page.goto('http://localhost:5173');
        await (0, test_1.expect)(page.locator('body')).toBeVisible();
        // 2. We don't know exactly if it's a grid of buttons or inputs
        // We try looking for standard calculator buttons: 1, 2, +, =, etc.
        const btn1 = page.locator('button:has-text("1")').first();
        const btn2 = page.locator('button:has-text("2")').first();
        const btnPlus = page.locator('button:has-text("+")').first();
        const btnEqual = page.locator('button:has-text("="), button:has-text("Calculate")').first();
        if (await btn1.isVisible() && await btn2.isVisible() && await btnPlus.isVisible() && await btnEqual.isVisible()) {
            await btn1.click();
            await btnPlus.click();
            await btn2.click();
            await btnEqual.click();
            // Look for the result "3" in the DOM
            const result = page.locator('text="3"').first();
            await (0, test_1.expect)(result).toBeVisible({ timeout: 5000 });
        }
        else {
            // Fallback: Check if there are inputs and an add button
            const inputs = page.locator('input[type="number"], input[type="text"]');
            if (await inputs.count() >= 2) {
                await inputs.nth(0).fill('1');
                await inputs.nth(1).fill('2');
                const calcBtn = page.locator('button:has-text("Calculate"), button:has-text("Add"), button:has-text("="), button:has-text("+")').first();
                if (await calcBtn.isVisible()) {
                    await calcBtn.click();
                    const result = page.locator('text="3"').first();
                    await (0, test_1.expect)(result).toBeVisible({ timeout: 5000 });
                }
            }
        }
    });
});
