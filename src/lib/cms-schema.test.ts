import { describe, expect, it } from "vitest";
import {
  contactFormSchema,
  newsletterSubscribeSchema,
  postServerSchema,
  slugify,
  webhookCreateSchema,
} from "#/lib/cms-schema";

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
});
