export function isSuperuserEmail(email: string | null | undefined) {
  if (!email) return false;
  const list = (process.env.SUPERUSER_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

