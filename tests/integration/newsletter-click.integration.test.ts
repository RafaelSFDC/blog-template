import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  recordNewsletterClick: vi.fn(),
}));

vi.mock("#/server/newsletter-campaigns", () => ({
  recordNewsletterClick: mocks.recordNewsletterClick,
}));

function getClickHandler() {
  return (
    (Route as unknown as {
      options?: {
        server?: {
          handlers?: {
            GET?: (input: { request: Request }) => Promise<Response>;
          };
        };
      };
    }).options?.server?.handlers?.GET ?? null
  );
}

import { Route } from "#/routes/api/newsletter/click";

describe("newsletter click api integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to safe https targets", async () => {
    const handler = getClickHandler();
    expect(handler).toBeTypeOf("function");

    const response = await handler!({
      request: new Request(
        "http://localhost:3000/api/newsletter/click?deliveryId=42&url=https%3A%2F%2Fexample.com%2Foffer",
      ),
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://example.com/offer");
    expect(mocks.recordNewsletterClick).toHaveBeenCalledWith(42, "https://example.com/offer");
  });

  it("blocks invalid or unsafe redirect targets", async () => {
    const handler = getClickHandler();
    expect(handler).toBeTypeOf("function");

    const response = await handler!({
      request: new Request(
        "http://localhost:3000/api/newsletter/click?deliveryId=42&url=javascript%3Aalert(1)",
      ),
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid target URL");
    expect(mocks.recordNewsletterClick).not.toHaveBeenCalled();
  });
});
