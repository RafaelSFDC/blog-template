type OperationalLevel = "info" | "warn" | "error";

type OperationalEnvelope = {
  actor: string | null;
  entity: string | null;
  outcome: "success" | "warning" | "failure";
};

function resolveEnvelope(payload: Record<string, unknown>, level: OperationalLevel): OperationalEnvelope {
  const actor =
    (typeof payload.actor === "string" && payload.actor) ||
    (typeof payload.actorUserId === "string" && payload.actorUserId) ||
    (typeof payload.ownerId === "string" && payload.ownerId) ||
    null;
  const entity =
    (typeof payload.entity === "string" && payload.entity) ||
    (typeof payload.entityType === "string" && payload.entityType) ||
    (typeof payload.scope === "string" && payload.scope) ||
    null;
  const explicitOutcome =
    typeof payload.outcome === "string" && payload.outcome.length > 0
      ? payload.outcome
      : null;
  const outcome =
    explicitOutcome === "success" || explicitOutcome === "warning" || explicitOutcome === "failure"
      ? explicitOutcome
      : level === "error"
        ? "failure"
        : level === "warn"
          ? "warning"
          : "success";

  return { actor, entity, outcome };
}

export function logOperationalEvent(
  event: string,
  payload: Record<string, unknown>,
  level: OperationalLevel = "info",
) {
  const envelope = resolveEnvelope(payload, level);
  const entry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    actor: envelope.actor,
    entity: envelope.entity,
    outcome: envelope.outcome,
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
