import crypto from "crypto";

export function hashIpForAnalytics(ip: string | null | undefined) {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT || "dev-ip-salt-change-me";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

