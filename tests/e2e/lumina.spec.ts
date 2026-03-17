import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

test.beforeEach(() => {
  if (process.platform === "win32") {
    execFileSync("cmd.exe", ["/c", "pnpm", "seed:fixtures"], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    return;
  }

  execFileSync("pnpm", ["seed:fixtures"], {
    cwd: process.cwd(),
    stdio: "pipe",
  });
});

async function signInAs(page: Page, email: string) {
  const response = await page.evaluate(
    async ({ loginEmail, password }) => {
      const result = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password,
          callbackURL: "/dashboard",
        }),
      });

      return {
        ok: result.ok,
        status: result.status,
        body: await result.text(),
      };
    },
    { loginEmail: email, password: "Password123!" },
  );

  expect(response.ok, `Sign-in failed with status ${response.status}: ${response.body}`).toBe(true);
}

test("renders the Lumina commercial surface with coherent beta-first CTAs", async ({ page }) => {
  await page.goto("/lumina");

  await expect(page.getByRole("heading", { name: /publication operating system/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /request beta access/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /pricing/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /how it works/i }).first()).toBeVisible();
  await expect(page.getByText(/generic site builder/i)).toBeVisible();

  await page.getByRole("link", { name: /pricing/i }).first().click();
  await expect(page).toHaveURL(/\/lumina\/pricing$/);
  await expect(page.getByText(/self-serve checkout/i)).toBeVisible();

  await page.goto("/lumina/how-it-works");
  await expect(page.getByRole("heading", { name: /one product spine/i })).toBeVisible();

  await page.goto("/lumina/faq");
  await expect(
    page.getByText(
      /reader memberships for a publication built with lumina stay on that publication's public pricing flow/i,
    ),
  ).toBeVisible();

  await page.goto("/lumina/for-creators");
  await expect(page.getByRole("heading", { name: /run your newsletter, site, and membership business/i })).toBeVisible();
});

test("renders the beta request surface with the qualification form", async ({ page }) => {
  await page.goto("/lumina/beta");

  await page.locator('input[name="name"]').fill("Launch Owner");
  await page.locator('input[name="email"]').fill("launch-owner@example.com");
  await page.locator('input[name="currentStack"]').fill("Ghost and Mailchimp");
  await page
    .locator('textarea[name="message"]')
    .fill("We need a cleaner launch path that connects site, newsletter, and memberships.");
  await expect(page.locator('input[name="name"]')).toHaveValue("Launch Owner");
  await expect(page.locator('input[name="email"]')).toHaveValue("launch-owner@example.com");
  await expect(page.getByRole("button", { name: /request beta access/i })).toBeVisible();
});

test("keeps product pricing and publication membership pricing clearly separated", async ({ page }) => {
  await page.goto("/lumina/pricing");
  await expect(page.getByRole("link", { name: /request beta access/i }).first()).toBeVisible();
  await expect(page.getByText(/self-serve checkout/i)).toBeVisible();

  await page.goto("/pricing");
  await expect(page.getByText(/this page sells reader access to this publication/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /lumina product pricing/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /continue to checkout|sign in to subscribe|plan not configured/i }).first()).toBeVisible();
});

test("lets readers choose a pricing path before checkout", async ({ page }) => {
  await page.goto("/pricing");

  await expect(page.getByText(/choose the commitment that matches reader confidence/i)).toBeVisible();
  await page.getByRole("button", { name: /choose annual/i }).click();
  await expect(page.getByRole("heading", { name: /annual/i }).nth(1)).toBeVisible();
  await expect(page.getByText(/selected path/i)).toBeVisible();
  await expect(page.getByText(/best value|long-term seat in their inbox/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in to subscribe|plan not configured/i })).toBeVisible();
});

test("surfaces retention-focused account prompts for inactive, active, and past-due readers", async ({ page }) => {
  await page.goto("/auth/login");
  await signInAs(page, "reader@lumina.test");
  await page.goto("/account");
  await expect(page.getByText(/free reader/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /see membership plans/i }).first()).toBeVisible();

  await page.goto("/auth/login");
  await signInAs(page, "member@lumina.test");
  await page.goto("/account");
  await expect(page.getByText(/active membership/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /manage billing/i }).first()).toBeVisible();

  await page.goto("/auth/login");
  await signInAs(page, "past-due@lumina.test");
  await page.goto("/account");
  await expect(page.getByText(/payment issue/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /fix billing/i }).first()).toBeVisible();
});

test("shows the analytics dashboard fallback when PostHog is not configured", async ({ page }) => {
  await page.goto("/auth/login");
  await signInAs(page, "admin@lumina.test");
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard\/setup$/);
  await page.goto("/dashboard?skipSetup=1");
  await expect(page).toHaveURL(/\/dashboard\/?$/);

  await page.goto("/dashboard/analytics");

  await expect(page.getByRole("heading", { name: /growth analytics/i })).toBeVisible();
  await expect(page.getByText(/posthog not configured/i)).toBeVisible();
  await expect(page.getByText(/unlock the product analytics dashboard/i)).toBeVisible();
});
