import { getCurrentUser } from "@/server/services/session";

export async function requireSuperuser() {
  const user = await getCurrentUser();
  if (!user || user.role !== "superuser") {
    return null;
  }
  return user;
}
