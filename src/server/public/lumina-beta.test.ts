import { describe, expect, it } from "vitest";
import { betaRequestSubmissionSchema } from "#/schemas";
import { buildLuminaBetaRequestRecord } from "#/server/actions/public/lumina-beta";

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

  it("keeps schema payload aligned with record builder contract", () => {
    const parsed = betaRequestSubmissionSchema.parse({
      name: "Lia",
      email: "lia@example.com",
      role: "journalist",
      publicationType: "premium_blog",
      currentStack: "Notion",
      message: "Need a more coherent publishing workflow.",
      source: "website",
      turnstileToken: "cf-turnstile-test-token",
    });

    const record = buildLuminaBetaRequestRecord(parsed);

    expect(record.subject).toContain("[Lumina Beta]");
    expect(record.subject).toContain(parsed.role);
    expect(record.message).toContain(`Role: ${parsed.role}`);
    expect(record.message).toContain(`Publication type: ${parsed.publicationType}`);
    expect(record.message).toContain(parsed.message);
  });
});

