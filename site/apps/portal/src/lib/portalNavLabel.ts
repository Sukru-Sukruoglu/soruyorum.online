type SessionLike = {
  email?: string | null;
  user?: {
    name?: string | null;
  } | null;
};

export function portalNavLabel(session: SessionLike): string {
  const trimmed = session.user?.name?.trim();
  if (trimmed) return trimmed;

  const email = session.email?.trim();
  if (email?.includes("@")) {
    const local = email.split("@")[0];
    return local && local.length > 0 ? local : "Hesabım";
  }

  return "Hesabım";
}
