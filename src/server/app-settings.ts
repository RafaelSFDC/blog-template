import { eq } from "drizzle-orm";
import { db } from "#/server/db/index";
import { appSettings } from "#/server/db/schema";

export async function getSettingValue(key: string) {
  const row = await db.query.appSettings.findFirst({
    where: eq(appSettings.key, key),
  });
  return row?.value ?? undefined;
}

export async function getSettingValues(keys: string[]) {
  const rows = await db.select().from(appSettings);
  const values: Record<string, string> = {};

  for (const row of rows) {
    if (keys.includes(row.key)) {
      values[row.key] = row.value;
    }
  }

  return values;
}

export function parseBooleanSetting(value: string | undefined, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  if (value === "true" || value === "1") {
    return true;
  }

  if (value === "false" || value === "0") {
    return false;
  }

  return fallback;
}

