import { expect, test, type Page } from "@playwright/test";
import {
  reseedFixtures,
  signInAsRole,
  skipSetupGate,
} from "./helpers";

test.beforeEach(() => {
  reseedFixtures();
});

async function expectDashboardRedirect(page: Page, attemptedPath: string) {
  await page.goto(attemptedPath);
  await expect(page).toHaveURL(/\/dashboard\/?$/);
  await expect(
    page.getByRole("heading", { name: /editorial dashboard/i }),
  ).toBeVisible();
}

test("admins can inspect seeded settings, exercise stable controls, and verify public reflection", async ({
  page,
}) => {
  await page.goto("/auth/login");
  await signInAsRole(page, "admin");
  await skipSetupGate(page);

  await page.goto("/dashboard/settings");
  await expect(
    page.getByRole("heading", { name: /blog settings/i }),
  ).toBeVisible();
  await expect(
    page.getByTestId("settings-security-setup-warning"),
  ).toBeVisible();
  await expect(
    page.getByTestId("settings-security-contact-warning"),
  ).toBeVisible();
  await expect(page.getByTestId("settings-font-family")).toContainText(
    /space grotesk/i,
  );
  await expect(page.getByTestId("settings-theme-variant")).toContainText(
    /lumina/i,
  );

  await page.getByTestId("settings-social-link-add").click();
  await page
    .getByTestId("settings-social-link-url-0")
    .fill("https://x.com/signal-ledger");
  await expect(page.getByTestId("settings-social-link-url-0")).toHaveValue(
    "https://x.com/signal-ledger",
  );

  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /lumina/i }).first(),
  ).toBeVisible();
  await expect(
    page.getByText(new RegExp(`${new Date().getFullYear()} Lumina`)),
  ).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /fixture publication for staging and tests/i,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "index, follow",
  );
  await expect(page).toHaveTitle(/lumina/i);
  await expect(page.locator("body")).toHaveClass(/theme-lumina/i);
  await expect(
    page.locator('link[href*="family=Space+Grotesk"]'),
  ).toHaveCount(1);
});

test("reader accounts stay out of the dashboard", async ({ page }) => {
  await page.goto("/auth/login");
  await signInAsRole(page, "reader");

  await page.goto("/dashboard");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: /lumina/i }).first()).toBeVisible();
});

test("author, editor, and moderator cannot access admin-only settings", async ({
  page,
}) => {
  for (const role of ["author", "editor", "moderator"] as const) {
    await page.goto("/auth/login");
    await signInAsRole(page, role);
    await expectDashboardRedirect(page, "/dashboard/settings");
  }
});

test("admin and super-admin retain access to restricted settings operations", async ({
  page,
}) => {
  for (const role of ["admin", "super-admin"] as const) {
    await page.goto("/auth/login");
    await signInAsRole(page, role);
    await skipSetupGate(page);

    await page.goto("/dashboard/settings");
    await expect(
      page.getByRole("heading", { name: /blog settings/i }),
    ).toBeVisible();
    await expect(page.getByTestId("settings-save")).toBeVisible();
  }
});
