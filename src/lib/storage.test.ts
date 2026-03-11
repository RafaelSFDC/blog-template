import { describe, expect, it } from "vitest";
import {
  getMediaPublicUrl,
  resolveStorageMode,
  sanitizeMediaFilename,
} from "#/lib/storage";

describe("storage", () => {
  it("resolves local mode when no binding or remote config exists", () => {
    expect(
      resolveStorageMode({
        hasBinding: false,
        hasRemoteApiConfig: false,
      }),
    ).toBe("local");
  });

  it("resolves remote-api mode when credentials are available", () => {
    expect(
      resolveStorageMode({
        hasBinding: false,
        hasRemoteApiConfig: true,
      }),
    ).toBe("remote-api");
  });

  it("prefers a public R2 url when configured", () => {
    expect(
      getMediaPublicUrl("hero.png", {
        mode: "binding",
        publicUrl: "https://media.example.com",
      }),
    ).toBe("https://media.example.com/hero.png");
  });

  it("falls back to the media api when no public bucket domain is configured", () => {
    expect(
      getMediaPublicUrl("hero.png", {
        mode: "binding",
      }),
    ).toBe("/api/media/hero.png");
  });

  it("uses local uploads when in local mode and sanitizes filenames", () => {
    expect(
      getMediaPublicUrl("hero.png", {
        mode: "local",
      }),
    ).toBe("/uploads/hero.png");

    const sanitized = sanitizeMediaFilename("Meu Hero Banner!.png");
    expect(sanitized).toMatch(/^meu-hero-banner-[a-z0-9-]+\.png$/);
  });
});
