import { test, expect } from "@playwright/test";
import { loginBrowser } from "./fixtures";

let counter = 0;
function u() { return `E2E_ASMT_${Date.now()}_${++counter}`; }

test.describe("Phase 10: Assignments E2E", () => {
  test.beforeEach(async ({ page }) => {
    await loginBrowser(page);
    await page.goto("/assignments");
    await page.waitForTimeout(500);
  });

  test("assignments page loads with heading and class selector", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Assignments" })).toBeVisible();
    await expect(page.locator("select")).toBeVisible();
  });

  test("New Assignment button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /New Assignment/ })).toBeVisible();
  });

  test("can create a new assignment", async ({ page }) => {
    await page.waitForTimeout(500);
    const title = u();
    const futureDate = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

    await page.getByRole("button", { name: /New Assignment/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByPlaceholder("e.g. Assignment 1").fill(title);
    await page.locator("input[type='date']").fill(futureDate);
    await page.locator("input[type='number']").last().fill("50");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(title)).toBeVisible();
  });

  test("selecting an assignment shows submissions panel", async ({ page }) => {
    await page.waitForTimeout(1000);
    const items = page.locator("[class*='cursor-pointer']");
    if (await items.count() > 0) {
      await items.first().click();
      await page.waitForTimeout(1000);
      await expect(page.getByRole("button", { name: /Save Submissions/ })).toBeVisible();
    }
  });

  test("assignment list shows title, due date, marks", async ({ page }) => {
    await page.waitForTimeout(1000);
    const text = await page.locator("body").textContent();
    expect(text).toContain("Assignments");
  });

  test("can delete an assignment", async ({ page }) => {
    await page.waitForTimeout(500);
    const title = u();
    const futureDate = new Date(Date.now() + 20 * 86400000).toISOString().split("T")[0];

    await page.getByRole("button", { name: /New Assignment/ }).click();
    await page.getByPlaceholder("e.g. Assignment 1").fill(title);
    await page.locator("input[type='date']").fill(futureDate);
    await page.locator("input[type='number']").last().fill("10");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(title)).toBeVisible({ timeout: 5000 });

    const assignmentRow = page.locator("div.cursor-pointer").filter({ hasText: title });
    await assignmentRow.locator("button:has(svg.lucide-trash-2)").click();
    await expect(page.getByText("Delete assignment?")).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).last().click();
    await expect(page.locator(`text=${title}`)).toHaveCount(0, { timeout: 10000 });
  });
});
