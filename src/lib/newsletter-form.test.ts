import { describe, expect, it } from "vitest";
import {
  buildNewsletterTemplateFromPost,
  mapNewsletterToFormValues,
  normalizeNewsletterCampaignSubmission,
} from "#/lib/newsletter-form";

describe("newsletter-form", () => {
  it("maps stored campaigns into editor defaults", () => {
    const values = mapNewsletterToFormValues({
      subject: "Weekly Brief",
      preheader: "Top stories",
      content: "<p>Hello</p>",
      postId: 12,
      segment: "premium_members",
      scheduledAt: new Date("2026-03-20T12:30:00.000Z"),
    });

    expect(values).toMatchObject({
      subject: "Weekly Brief",
      preheader: "Top stories",
      postId: 12,
      segment: "premium_members",
    });
    expect(values.scheduledAt).toContain("2026-03-20T12:30");
  });

  it("builds a campaign template from a published post", () => {
    const template = buildNewsletterTemplateFromPost({
      id: 3,
      title: "Launch Notes",
      excerpt: "A concise launch summary",
      slug: "launch-notes",
      publishedAt: "2026-03-15T10:00:00.000Z",
    });

    expect(template.subject).toBe("New post: Launch Notes");
    expect(template.preheader).toBe("A concise launch summary");
    expect(template.content).toContain("/blog/launch-notes");
    expect(template.segment).toBe("all_active");
  });

  it("normalizes queue submissions into server payloads", () => {
    const payload = normalizeNewsletterCampaignSubmission(
      {
        subject: "  Weekly Brief  ",
        preheader: "  Top stories  ",
        content: "  <p>Hello</p>  ",
        postId: 7,
        segment: "free_subscribers",
        scheduledAt: "2026-03-18T09:15",
      },
      "queue",
    );

    expect(payload).toMatchObject({
      subject: "Weekly Brief",
      preheader: "Top stories",
      content: "<p>Hello</p>",
      postId: 7,
      segment: "free_subscribers",
      action: "queue",
    });
    expect(payload.scheduledAt).toEqual(new Date("2026-03-18T09:15"));
  });
});
