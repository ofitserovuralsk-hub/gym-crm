"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/auth";

const ROLE_LABEL: Record<Role, string> = {
  admin: "Админ",
  owner: "Владелец",
};

export default function UserBar({
  email,
  role,
}: {
  email: string | null;
  role: Role;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-3 border-b border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-400">
      <span>
        {email} · {ROLE_LABEL[role]}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isPending}
        className="rounded-lg border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
      >
        {isPending ? "Выход…" : "Выйти"}
      </button>
    </div>
  );
}
