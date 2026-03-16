import { describe, expect, it } from "vitest";
import {
  commentStatusUpdateSchema,
  contactFormSchema,
  newsletterSubscribeSchema,
  postServerSchema,
  publicCommentSchema,
  redirectSchema,
  recordIdSchema,
  slugify,
  webhookCreateSchema,
} from "#/schemas";

describe("cms-schema", () => {
  it("normalizes slugs with accents and punctuation", () => {
    expect(slugify("Olá, Mundo Editorial!")).toBe("ola-mundo-editorial");
  });

  it("rejects scheduled posts without a publication date", () => {
    const result = postServerSchema.safeParse({
      title: "Scheduled post",
      slug: "scheduled-post",
      excerpt: "A short excerpt",
      content: "Some content",
      status: "scheduled",
      isPremium: false,
      teaserMode: "excerpt",
      categoryIds: [],
      tagIds: [],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Scheduled posts require a publication date");
  });

  it("rejects invalid newsletter emails", () => {
    const result = newsletterSubscribeSchema.safeParse({ email: "not-an-email" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Must be a valid email");
  });

  it("rejects incomplete contact payloads", () => {
    const result = contactFormSchema.safeParse({
      name: "John",
      email: "john@example.com",
      subject: "Hi",
      message: "short",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Subject too short");
  });

  it("rejects invalid webhook urls", () => {
    const result = webhookCreateSchema.safeParse({
      name: "Zapier",
      url: "notaurl",
      event: "post.published",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Must be a valid URL");
  });

  it("rejects invalid public comments", () => {
    const result = publicCommentSchema.safeParse({
      postId: 0,
      authorName: "",
      authorEmail: "not-an-email",
      content: "ok",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Invalid id");
  });

  it("rejects invalid comment status updates", () => {
    const result = commentStatusUpdateSchema.safeParse({
      id: 1,
      status: "archived",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("Invalid option");
  });

  it("rejects invalid record ids", () => {
    const result = recordIdSchema.safeParse({ id: -1 });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Invalid id");
  });

  it("rejects invalid redirects", () => {
    const result = redirectSchema.safeParse({
      sourcePath: "old-path",
      destinationPath: "new-path",
      statusCode: 307,
    });

    expect(result.success).toBe(false);
  });
});
