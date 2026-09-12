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

  const role: Role = user.user_metadata?.role === "owner" ? "owner" : "admin";

  return { id: user.id, email: user.email ?? null, role };
}
