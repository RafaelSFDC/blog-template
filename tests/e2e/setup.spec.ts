import { expect, test } from "@playwright/test";

test("redirects admins into setup and lets them complete the first-run flow", async ({ page }) => {
  await page.goto("/auth/login");
  await page.locator('input[type="email"]').fill("admin@lumina.test");
  await page.locator('input[type="password"]').fill("Password123!");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/dashboard\/setup$/);
  await expect(page.getByRole("heading", { name: /setup inicial/i })).toBeVisible();

  await page.getByRole("button", { name: /salvar e continuar/i }).click();
  await expect(page.getByRole("heading", { name: /publicacao e seo/i })).toBeVisible();

  await page.getByRole("button", { name: /salvar e continuar/i }).click();
  await expect(page.getByRole("heading", { name: /monetizacao/i })).toBeVisible();

  await page.getByPlaceholder("price_monthly_...").fill("price_test_monthly");
  await page.getByPlaceholder("price_annual_...").fill("price_test_annual");
  await page.getByRole("button", { name: /salvar e continuar/i }).click();
  await expect(page.getByRole("heading", { name: /newsletter/i })).toBeVisible();

  await page.getByRole("button", { name: /salvar e continuar/i }).click();
  await expect(page.getByRole("heading", { name: /conteudo inicial/i })).toBeVisible();

  await page.getByRole("button", { name: /criar starter kit e concluir/i }).click();

  await expect(page).toHaveURL(/\/dashboard\/?$/);
  await expect(page.getByRole("heading", { name: /editorial dashboard/i })).toBeVisible();
  await expect(page.getByText(/o wizard foi concluido/i)).toBeVisible();

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard\/?$/);
  await expect(page.getByRole("heading", { name: /editorial dashboard/i })).toBeVisible();
});
