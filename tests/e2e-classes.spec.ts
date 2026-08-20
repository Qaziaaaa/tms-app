import { test, expect } from "@playwright/test";
import { loginBrowser } from "./fixtures";

let counter = 0;
function u() { return `E2E_CLS_${Date.now()}_${++counter}`; }

test.describe("Phase 7: Classes E2E", () => {
  test.beforeEach(async ({ page }) => {
    await loginBrowser(page);
    await page.goto("/classes");
    await page.waitForTimeout(500);
  });

  test("classes page loads with header and Add Class button", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Classes" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Add Class/ })).toBeVisible();
  });

  test("seeded classes are displayed as cards", async ({ page }) => {
    await page.waitForTimeout(500);
    await expect(page.locator("[data-slot='card-title']").first()).toBeVisible();
  });

  test("can create a new class via dialog", async ({ page }) => {
    const name = u();
    await page.getByRole("button", { name: /Add Class/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByPlaceholder("e.g. Artificial Intelligence").fill(name);
    await page.getByPlaceholder("e.g. Computer Science").fill("E2E Testing");
    await page.getByPlaceholder("e.g. 2025").fill("2026");
    await page.getByPlaceholder("e.g. Monday 10:00 AM").fill("Friday 2 PM");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text=${name}`).first()).toBeVisible({ timeout: 5000 });
  });

  test("can open edit dialog for a class", async ({ page }) => {
    const editButtons = page.locator("button").filter({ has: page.locator("svg.lucide-pencil") });
    if (await editButtons.count() > 0) {
      await editButtons.first().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText("Edit Class")).toBeVisible();
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    }
  });

  test("can delete a class via confirmation dialog", async ({ page }) => {
    const name = u();
    await page.getByRole("button", { name: /Add Class/ }).click();
    await page.getByPlaceholder("e.g. Artificial Intelligence").fill(name);
    await page.getByPlaceholder("e.g. Computer Science").fill("Delete Me");
    await page.getByPlaceholder("e.g. 2025").fill("2026");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });

    const classCard = page.locator("[data-slot='card']").filter({ hasText: name });
    await expect(classCard).toBeVisible({ timeout: 5000 });
    await classCard.locator("button:has(svg.lucide-trash-2)").click();

    await expect(page.getByText("Delete class?")).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).last().click();

    await expect(page.getByText("Class deleted")).toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text=${name}`)).toHaveCount(0, { timeout: 10000 });
  });

  test("empty form shows Save disabled", async ({ page }) => {
    await page.getByRole("button", { name: /Add Class/ }).click();
    const saveBtn = page.getByRole("button", { name: "Save" });
    await expect(saveBtn).toBeDisabled();
  });
});
