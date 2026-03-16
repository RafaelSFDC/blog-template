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

async function waitForClientReady(page: Page) {
  await page.waitForTimeout(500);
}

async function advanceSetupWizard(page: Page) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (await page.getByRole("heading", { name: /conteudo inicial/i }).isVisible()) {
      await page.getByRole("button", { name: /criar starter kit e concluir/i }).click();
      return;
    }

    if (await page.getByPlaceholder("price_monthly_...").isVisible()) {
      await page.getByPlaceholder("price_monthly_...").fill("price_test_monthly");
      await page.getByPlaceholder("price_annual_...").fill("price_test_annual");
    }

    await page.getByRole("button", { name: /salvar e continuar/i }).click();
    await waitForClientReady(page);
  }
}

test("redirects admins into setup, supports pause/resume, and completes the first-run flow", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await signInAs(page, "admin@lumina.test");
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/dashboard\/setup$/);
  await expect(page.getByRole("heading", { name: /setup inicial/i })).toBeVisible();
  await expect(page.getByText(/setup not started/i)).toBeVisible();
  await waitForClientReady(page);
  await page.getByRole("link", { name: /pular por agora/i }).click();

  await expect(page).toHaveURL(/\/dashboard\/?$/);
  await expect(page.getByRole("heading", { name: /setup pausado/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /retomar setup/i })).toBeVisible();

  await page.goto("/dashboard/settings");
  await expect(page.getByText(/finalize o setup guiado/i)).toBeVisible();

  await page.goto("/dashboard/pages");
  await expect(page.getByText(/o launch ainda depende do setup base/i)).toBeVisible();

  await page.goto("/dashboard/posts");
  await expect(page.getByText(/ainda existe setup critico antes do primeiro conteudo/i)).toBeVisible();

  await page.getByRole("link", { name: /retomar setup/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/setup$/);
  await expect(page.getByText(/continue de onde parou/i)).toBeVisible();
  await waitForClientReady(page);

  await advanceSetupWizard(page);

  await expect(page).toHaveURL(/\/dashboard\/?$/);
  await expect(page.getByRole("heading", { name: /editorial dashboard/i })).toBeVisible();
  await expect(page.getByText(/onboarding concluido/i)).toBeVisible();

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard\/?$/);
  await expect(page.getByRole("heading", { name: /editorial dashboard/i })).toBeVisible();

  await page.getByRole("link", { name: /revisar onboarding/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/setup$/);
  await expect(page.getByText(/nada aqui volta a bloquear o dashboard/i)).toBeVisible();
});

test("redirects super-admins through the same first-run flow rules", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await signInAs(page, "super-admin@lumina.test");
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/dashboard\/setup$/);
  await expect(page.getByRole("heading", { name: /setup inicial/i })).toBeVisible();
  await waitForClientReady(page);

  await page.getByRole("link", { name: /pular por agora/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/?$/);
  await expect(page.getByRole("heading", { name: /setup pausado/i })).toBeVisible();
});
