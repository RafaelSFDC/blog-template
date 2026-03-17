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

async function finishSetupStepsUntilPreset(page: Page) {
  const starterKitButton = page.getByRole("button", { name: /criar starter kit e concluir/i });
  const continueButton = page.getByRole("button", { name: /salvar e continuar/i });

  let completedTransitions = 0;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await starterKitButton.isVisible()) {
      return;
    }

    if (await page.getByPlaceholder("price_monthly_...").isVisible()) {
      await page.getByPlaceholder("price_monthly_...").fill("price_test_monthly");
      await page.getByPlaceholder("price_annual_...").fill("price_test_annual");
    }

    if (!(await continueButton.isVisible())) {
      await page.waitForTimeout(300);
      continue;
    }

    if (!(await continueButton.isEnabled())) {
      await page.waitForTimeout(300);
      continue;
    }

    await continueButton.click({ noWaitAfter: true });
    completedTransitions += 1;
    await waitForClientReady(page);

    if (completedTransitions >= 5) {
      break;
    }
  }

  await expect(starterKitButton).toBeVisible({ timeout: 10000 });
}

async function selectPreset(page: Page, label: string) {
  await page.getByRole("button", { name: new RegExp(label, "i") }).click();
}

async function completeSetup(page: Page, input: {
  presetLabel: string;
  withStarterKit: boolean;
}) {
  await finishSetupStepsUntilPreset(page);
  await selectPreset(page, input.presetLabel);

  if (input.withStarterKit) {
    await page.getByRole("button", { name: /criar starter kit e concluir/i }).click();
  } else {
    await page.getByRole("button", { name: /concluir sem starter kit/i }).click();
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

  await completeSetup(page, {
    presetLabel: "Premium Publication",
    withStarterKit: true,
  });

  await expect(page).toHaveURL(/\/dashboard\/?$/);
  await expect(page.getByRole("heading", { name: /editorial dashboard/i })).toBeVisible();
  await expect(page.getByText(/onboarding concluido/i)).toBeVisible();

  await page.goto("/dashboard/pages");
  await expect(page.getByText("/about")).toHaveCount(1);
  await expect(page.getByText("/pricing")).toHaveCount(1);
  await expect(page.getByText("/contact")).toHaveCount(1);
  await expect(page.getByText("/newsletter")).toHaveCount(1);
  await expect(page.getByText("/members-only-archive")).toHaveCount(1);

  await page.goto("/dashboard/posts");
  await expect(page.getByText(/welcome to your publication/i)).toHaveCount(1);

  await page.goto("/dashboard/setup");
  await expect(page.getByText(/nada aqui volta a bloquear o dashboard/i)).toBeVisible();
  await selectPreset(page, "Premium Publication");
  await page.getByRole("button", { name: /criar starter kit e concluir/i }).click();

  await expect(page).toHaveURL(/\/dashboard\/?$/);
  await page.goto("/dashboard/pages");
  await expect(page.getByText("/about")).toHaveCount(1);
  await expect(page.getByText("/members-only-archive")).toHaveCount(1);

  await page.goto("/dashboard/posts");
  await expect(page.getByText(/welcome to your publication/i)).toHaveCount(1);
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

for (const presetCase of [
  {
    key: "creator",
    label: "Creator",
    badge: "Creator publication",
    heading: "Latest Notes",
    cta: "Read the latest notes",
  },
  {
    key: "magazine",
    label: "Magazine",
    badge: "Magazine issue",
    heading: "Featured Stories",
    cta: "Browse the latest issue",
  },
  {
    key: "premium_publication",
    label: "Premium Publication",
    badge: "Premium publication",
    heading: "Editor's Selection",
    cta: "Explore the members thesis",
  },
] as const) {
  test(`uses ${presetCase.key} as the public fallback direction when setup finishes without starter kit`, async ({ page }) => {
    await page.goto("/auth/login");
    await signInAs(page, "admin@lumina.test");
    await page.goto("/dashboard");

    await completeSetup(page, {
      presetLabel: presetCase.label,
      withStarterKit: false,
    });

    await expect(page).toHaveURL(/\/dashboard\/?$/);
    await page.goto("/");

    await expect(page.getByText(presetCase.badge)).toBeVisible();
    await expect(page.getByRole("heading", { name: /lumina/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: presetCase.heading })).toBeVisible();
    await expect(
      page.getByRole("link", { name: new RegExp(presetCase.cta, "i") }).first(),
    ).toBeVisible();
  });
}
