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

async function skipSetupGate(page: Page) {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard\/setup$/);
  await page.getByRole("link", { name: /pular por agora/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("lets admins triage beta requests and manage beta ops state", async ({ page }) => {
  await page.goto("/auth/login");
  await signInAs(page, "admin@lumina.test");
  await skipSetupGate(page);

  await page.goto("/dashboard/beta-ops");
  await expect(page.getByRole("heading", { name: /beta ops/i })).toBeVisible();
  await expect(page.getByText(/untriaged operator/i)).toBeVisible();
  await expect(page.getByText("Needs clearer pricing guidance").first()).toBeVisible();

  await page.getByRole("button", { name: /promote to beta ops/i }).click();
  await expect(page.getByText("Tracked", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /beta founder/i })).toBeVisible();
  await expect(page.getByText(/recent feedback/i)).toBeVisible();
});

test("shows beta triage affordances in the inbox", async ({ page }) => {
  await page.goto("/auth/login");
  await signInAs(page, "admin@lumina.test");
  await skipSetupGate(page);

  await page.goto("/dashboard/messages");
  await expect(page.getByRole("heading", { name: /inbox/i })).toBeVisible();
  await expect(page.getByText(/beta request/i).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /beta ops/i })).toBeVisible();
});
