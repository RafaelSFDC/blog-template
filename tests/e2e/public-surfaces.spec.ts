import { expect, test } from "@playwright/test";
import { reseedFixtures } from "./helpers";

test.beforeEach(() => {
  reseedFixtures();
});

test("renders managed public pages, author archives, taxonomy archives, and redirects", async ({ page }) => {
  await page.goto("/fixture-about");
  await expect(page.getByRole("heading", { name: /fixture about/i })).toBeVisible();
  await expect(page.getByText(/about lumina fixture content/i)).toBeVisible();

  await page.goto("/blog/category/operations");
  await expect(page.getByRole("heading", { name: /operations/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /fixture published post/i }).first()).toBeVisible();

  await page.goto("/blog/tag/launch");
  await expect(page.getByRole("heading", { name: /#launch/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /fixture published post/i }).first()).toBeVisible();

  await page.goto("/author/fixture-author");
  await expect(page.getByRole("heading", { name: /fixture author/i }).first()).toBeVisible();
  await expect(page.getByText(/writes fixture stories for end-to-end coverage/i).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /fixture published post/i }).first()).toBeVisible();
});
