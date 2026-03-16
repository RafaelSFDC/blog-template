type OperationalLevel = "info" | "warn" | "error";

export function logOperationalEvent(
  event: string,
  payload: Record<string, unknown>,
  level: OperationalLevel = "info",
) {
  const entry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
    return;
  }

  if (level === "warn") {
    console.warn(JSON.stringify(entry));
    return;
  }

  console.log(JSON.stringify(entry));
}
