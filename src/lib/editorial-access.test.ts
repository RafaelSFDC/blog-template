import { describe, expect, it } from "vitest";
import {
  canManagePostWorkflow,
  canResolveEditorialComments,
  ensurePostTransitionAllowed,
  isAdminRole,
  isEditorRole,
  isModeratorRole,
  normalizeRole,
} from "#/server/editorial/access";

describe("editorial access helpers", () => {
  it("normalizes legacy superAdmin role values", () => {
    expect(normalizeRole("superAdmin")).toBe("super-admin");
    expect(normalizeRole("admin")).toBe("admin");
    expect(normalizeRole(null)).toBeNull();
  });

  it("detects editor/admin role capabilities", () => {
    expect(isAdminRole("superAdmin")).toBe(true);
    expect(isEditorRole("editor")).toBe(true);
    expect(isModeratorRole("moderator")).toBe(true);
    expect(isEditorRole("author")).toBe(false);
  });

  it("matches workflow and moderation capabilities to elevated editorial roles", () => {
    expect(canManagePostWorkflow("editor")).toBe(true);
    expect(canManagePostWorkflow("admin")).toBe(true);
    expect(canManagePostWorkflow("author")).toBe(false);
    expect(canResolveEditorialComments("superAdmin")).toBe(true);
    expect(canResolveEditorialComments("moderator")).toBe(false);
  });

  it("blocks authors from publishing or scheduling posts", async () => {
    await expect(ensurePostTransitionAllowed("author", "published")).rejects.toThrow(
      "Only editors can publish, schedule, or archive posts",
    );
    await expect(ensurePostTransitionAllowed("author", "scheduled")).rejects.toThrow(
      "Only editors can publish, schedule, or archive posts",
    );
    await expect(ensurePostTransitionAllowed("author", "draft")).resolves.toBeUndefined();
  });
});
