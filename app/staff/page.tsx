import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser, type Role } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_LABEL, formatDateTime } from "@/lib/status";
import StaffForm from "./staff-form";
import StaffRowActions from "./staff-row-actions";

export const dynamic = "force-dynamic";

type StaffMember = {
  id: string;
  email: string;
  role: Role;
  lastSignInAt: string | null;
};

async function getStaff(): Promise<StaffMember[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });

  if (error) {
    throw new Error(`Не удалось загрузить сотрудников: ${error.message}`);
  }

  return data.users
    .map((u) => ({
      id: u.id,
      email: u.email ?? "—",
      role: (u.app_metadata?.role === "owner" ? "owner" : "admin") as Role,
      lastSignInAt: u.last_sign_in_at ?? null,
    }))
    .sort((a, b) => a.email.localeCompare(b.email));
}

export default async function StaffPage() {
  const currentUser = await getCurrentUser();
  // Раздел только для владельца (дублируется в каждом Server Action).
  if (currentUser?.role !== "owner") notFound();

  const staff = await getStaff();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
        ← Все клиенты
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Сотрудники</h1>
      <p className="mt-1 text-sm text-slate-400">
        Аккаунты для входа в систему. Администратор работает с клиентами,
        владелец дополнительно видит аналитику и управляет сотрудниками.
      </p>

      <div className="mt-4">
        <StaffForm />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {staff.map((member) => (
          <div
            key={member.id}
            className="rounded-xl border border-slate-800 bg-slate-900 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-100">
                  {member.email}
                  {member.id === currentUser.id && (
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      это вы
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {ROLE_LABEL[member.role]} · последний вход:{" "}
                  {formatDateTime(member.lastSignInAt)}
                </p>
              </div>
              <StaffRowActions
                userId={member.id}
                email={member.email}
                role={member.role}
                isSelf={member.id === currentUser.id}
              />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
