import { execFileSync } from "node:child_process";
import { expect, type Download, type Page } from "@playwright/test";

export const FIXTURE_PASSWORD = "Password123!";

export function reseedFixtures() {
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
}

export async function signInAs(page: Page, email: string, password = FIXTURE_PASSWORD) {
  const response = await page.evaluate(
    async ({ loginEmail, loginPassword }) => {
      const result = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          callbackURL: "/dashboard",
        }),
      });

      return {
        ok: result.ok,
        status: result.status,
        body: await result.text(),
      };
    },
    { loginEmail: email, loginPassword: password },
  );

  expect(response.ok, `Sign-in failed with status ${response.status}: ${response.body}`).toBe(true);
}

export async function signInViaUi(page: Page, email: string, password = FIXTURE_PASSWORD) {
  await page.goto("/auth/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

export async function skipSetupGate(page: Page) {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard\/setup$/);
  await page.goto("/dashboard?skipSetup=1");
  await expect(page).toHaveURL(/\/dashboard\/?$/);
}

export async function signInAndOpenDashboard(page: Page, email: string) {
  await page.goto("/auth/login");
  await signInAs(page, email);
  await skipSetupGate(page);
}

export async function expectToast(page: Page, pattern: RegExp | string) {
  await expect(page.getByText(pattern).last()).toBeVisible();
}

export async function captureDownload(page: Page, trigger: () => Promise<void>): Promise<Download> {
  const [download] = await Promise.all([page.waitForEvent("download"), trigger()]);
  return download;
}

export async function fillRichTextEditor(page: Page, value: string, index = 0) {
  const editor = page.locator(".tiptap.ProseMirror").nth(index);
  await editor.click();
  await editor.fill(value);
}
