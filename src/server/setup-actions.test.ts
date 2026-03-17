import { describe, expect, it } from "vitest";
import { withIsolatedDatabase } from "../../tests/helpers/sqlite-test-db";

async function upsertSettings(
  db: Awaited<typeof import("#/db/index")>["db"],
  appSettings: Awaited<typeof import("#/db/schema")>["appSettings"],
  entries: Array<{ key: string; value: string; updatedAt: Date }>,
) {
  for (const entry of entries) {
    await db
      .insert(appSettings)
      .values(entry)
      .onConflictDoUpdate({
        target: appSettings.key,
        set: {
          value: entry.value,
          updatedAt: entry.updatedAt,
        },
      });
  }
}

describe("setup actions", () => {
  it("returns skipped setup state without breaking checklist progress", async () => {
    await withIsolatedDatabase("setup-actions-skip", async () => {
      const [{ db }, { appSettings }, { getSetupStatusSummaryForRole }] = await Promise.all([
        import("#/db/index"),
        import("#/db/schema"),
        import("#/server/actions/system/setup-actions"),
      ]);

      await upsertSettings(db, appSettings, [
        {
          key: "setupWizardStartedAt",
          value: "2026-03-16T10:00:00.000Z",
          updatedAt: new Date(),
        },
        {
          key: "setupWizardSkippedAt",
          value: "2026-03-16T10:05:00.000Z",
          updatedAt: new Date(),
        },
      ]);

      const status = await getSetupStatusSummaryForRole("admin");

      expect(status).not.toBeNull();
      expect(status?.status).toBe("in_progress");
      expect(status?.isSkipped).toBe(true);
      expect(status?.isCompleted).toBe(false);
      expect(status?.nextAction?.step).toBe("identity");
      expect(status?.progressPercent).toBe(0);
    });
  }, 20000);

  it("treats completed setup as non-blocking even if content work remains", async () => {
    await withIsolatedDatabase("setup-actions-content", async () => {
      const [{ db }, { appSettings }, { getSetupStatusSummaryForRole }] = await Promise.all([
        import("#/db/index"),
        import("#/db/schema"),
        import("#/server/actions/system/setup-actions"),
      ]);

      await upsertSettings(db, appSettings, [
        {
          key: "setupWizardStartedAt",
          value: "2026-03-16T10:00:00.000Z",
          updatedAt: new Date(),
        },
        {
          key: "setupWizardCompletedAt",
          value: "2026-03-16T10:10:00.000Z",
          updatedAt: new Date(),
        },
        {
          key: "setupWizardSkippedAt",
          value: "",
          updatedAt: new Date(),
        },
        {
          key: "setupWizardLastStep",
          value: "content",
          updatedAt: new Date(),
        },
        {
          key: "sitePresetKey",
          value: "creator-journal",
          updatedAt: new Date(),
        },
      ]);

      const status = await getSetupStatusSummaryForRole("admin");

      expect(status).not.toBeNull();
      expect(status?.status).toBe("completed");
      expect(status?.isCompleted).toBe(true);
      expect(status?.isSkipped).toBe(false);
      expect(status?.lastStep).toBe("content");
      expect(status?.nextAction).toBeNull();
      expect(status?.sitePresetKey).toBe("creator");
    });
  }, 15000);

  it("returns the same setup summary for admin, super-admin, and legacy superAdmin", async () => {
    await withIsolatedDatabase("setup-actions-role-parity", async () => {
      const [{ db }, { appSettings }, { getSetupStatusSummaryForRole }] = await Promise.all([
        import("#/db/index"),
        import("#/db/schema"),
        import("#/server/actions/system/setup-actions"),
      ]);

      await upsertSettings(db, appSettings, [
        {
          key: "setupWizardStartedAt",
          value: "2026-03-16T10:00:00.000Z",
          updatedAt: new Date(),
        },
        {
          key: "blogName",
          value: "Lumina",
          updatedAt: new Date(),
        },
        {
          key: "blogDescription",
          value: "Launch-ready editorial OS",
          updatedAt: new Date(),
        },
        {
          key: "fontFamily",
          value: "Inter",
          updatedAt: new Date(),
        },
        {
          key: "themeVariant",
          value: "theme-linear",
          updatedAt: new Date(),
        },
      ]);

      const adminStatus = await getSetupStatusSummaryForRole("admin");
      const superAdminStatus = await getSetupStatusSummaryForRole("super-admin");
      const legacySuperAdminStatus = await getSetupStatusSummaryForRole("superAdmin");

      expect(adminStatus).toEqual(superAdminStatus);
      expect(adminStatus).toEqual(legacySuperAdminStatus);
    });
  }, 15000);
});
