import { expect, test } from "@playwright/test";

test("renders public smoke paths and health endpoints", async ({ page, request }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Lumina/i);

  await page.goto("/blog");
  await expect(page.getByRole("link", { name: /fixture published post/i }).first()).toBeVisible();

  const liveness = await request.get("/api/health");
  expect(liveness.ok()).toBe(true);
  await expect
    .poll(async () => {
      const payload = await liveness.json();
      return payload.status;
    })
    .toBe("ok");

  const readiness = await request.get("/api/health/readiness");
  expect([200, 503]).toContain(readiness.status());
  const readinessPayload = await readiness.json();
  expect(["ok", "degraded", "failed"]).toContain(readinessPayload.status);
  expect(Array.isArray(readinessPayload.checks)).toBe(true);
  expect(readinessPayload.checks.length).toBeGreaterThan(0);

  const dependencies = await request.get("/api/health/dependencies");
  expect(dependencies.ok()).toBe(true);
  const dependencyPayload = await dependencies.json();
  expect(Array.isArray(dependencyPayload.checks)).toBe(true);
});

test("renders the public auth entrypoints", async ({ page }) => {
  await page.goto("/auth/register");
  await expect(page.getByRole("heading", { name: /create your lumina account/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();

  await page.goto("/auth/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});

test("shows the premium teaser and membership call-to-action for anonymous readers", async ({ page }) => {
  await expect(async () => {
    await page.goto("/blog/fixture-premium-post", {
      waitUntil: "domcontentloaded",
    });
  }).toPass({
    intervals: [500, 1_000],
    timeout: 10_000,
  });
  await expect(page.getByRole("article").getByText(/Premium excerpt for member smoke coverage\./i)).toBeVisible();
  await expect(page.getByRole("button", { name: /subscribe now/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /compare plans/i })).toBeVisible();
});
