import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "owner";

export type CurrentUser = {
  id: string;
  email: string | null;
  role: Role;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Роль берём из app_metadata: её может менять только сервер (service_role).
  // user_metadata пользователь правит сам через supabase.auth.updateUser,
  // поэтому доверять ей для прав доступа нельзя.
  const role: Role = user.app_metadata?.role === "owner" ? "owner" : "admin";

  return { id: user.id, email: user.email ?? null, role };
}
