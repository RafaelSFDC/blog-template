import { createHash } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";

export interface SecurityRequestMetadata {
  ip: string | null;
  ipHash: string | null;
  userAgent: string | null;
  userAgentShort: string | null;
}

function getHeader(request: Request, names: string[]) {
  for (const name of names) {
    const value = request.headers.get(name);
    if (value) return value;
  }
  return null;
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function getClientIp(request: Request) {
  const forwarded = getHeader(request, [
    "cf-connecting-ip",
    "x-forwarded-for",
    "x-real-ip",
  ]);
  if (!forwarded) return null;
  return forwarded.split(",")[0]?.trim() || null;
}

export function getSecurityRequestMetadata(request: Request): SecurityRequestMetadata {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent");
  const userAgentShort = userAgent ? userAgent.slice(0, 160) : null;

  return {
    ip,
    ipHash: ip ? sha256(ip) : null,
    userAgent,
    userAgentShort,
  };
}

export function getCurrentSecurityRequestMetadata() {
  try {
    const request = getRequest();
    return request ? getSecurityRequestMetadata(request) : null;
  } catch {
    return null;
  }
}
