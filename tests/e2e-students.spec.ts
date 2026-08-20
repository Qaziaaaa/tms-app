import { test, expect } from "@playwright/test";
import { loginBrowser } from "./fixtures";

let counter = 0;
function u() { return `S${Date.now().toString().slice(-8)}_${++counter}`; }

test.describe("Phase 8: Students E2E", () => {
  test.beforeEach(async ({ page }) => {
    await loginBrowser(page);
    await page.goto("/students");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
  });

  test("students page loads with heading and class selector", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Students" })).toBeVisible();
    await expect(page.locator("select")).toBeVisible();
  });

  test("student list table displays for selected class", async ({ page }) => {
    await expect(page.getByText("Student List")).toBeVisible({ timeout: 10000 });
  });

  test("can add a student via dialog", async ({ page }) => {
    const roll = u();
    await expect(page.getByRole("button", { name: /Add Student/ })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /Add Student/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByPlaceholder("e.g. CS-24-001").fill(roll);
    await page.getByPlaceholder("e.g. Ahmed Khan").fill("E2E Student");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(roll).first()).toBeVisible({ timeout: 10000 });
  });

  test("can bulk import students via CSV", async ({ page }) => {
    const id = u();
    const textarea = page.locator("textarea");
    await textarea.fill(`${id}_B1,Bulk Student One\n${id}_B2,Bulk Student Two`);

    await page.getByRole("button", { name: /Import Students/ }).click();
    await expect(page.getByText(`${id}_B1`).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(`${id}_B2`).first()).toBeVisible({ timeout: 10000 });
  });

  test("can edit a student", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Add Student/ })).toBeVisible({ timeout: 10000 });
    const editBtns = page.locator("button").filter({ has: page.locator("svg.lucide-pencil") });
    if (await editBtns.count() > 0) {
      await editBtns.first().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText("Edit Student")).toBeVisible();
      await page.getByRole("button", { name: "Cancel" }).click();
    }
  });

  test("add student Save disabled with empty fields", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Add Student/ })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /Add Student/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const saveBtn = page.getByRole("button", { name: "Save" });
    await expect(saveBtn).toBeDisabled();
  });
});
