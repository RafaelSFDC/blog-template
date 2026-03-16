import { describe, expect, it } from "vitest";
import { buildLuminaBetaRequestRecord } from "#/server/public/lumina-beta";

describe("lumina beta request", () => {
  it("builds a triage-friendly contact message record", () => {
    const record = buildLuminaBetaRequestRecord({
      name: "Ari",
      email: "ari@example.com",
      role: "publication_lead",
      publicationType: "digital_magazine",
      currentStack: "WordPress and Mailchimp",
      message: "We want fewer disconnected launch steps.",
    });

    expect(record.subject).toContain("[Lumina Beta]");
    expect(record.subject).toContain("publication_lead");
    expect(record.message).toContain("Current stack: WordPress and Mailchimp");
  });
});
