import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { type MembershipStatus } from "@/lib/status";
import { getExpiringClients } from "@/lib/reminders";
import ClientsList from "./clients-list";

// Данные всегда свежие (Supabase-запросы идут с cache: "no-store") — без этой
// директивы `next build` пытается статически сгенерировать страницу и падает.
export const dynamic = "force-dynamic";

type Client = {
  id: string;
  fullName: string;
  phone: string;
  membershipStatus: MembershipStatus;
  membershipEndDate: string | null;
};

async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, full_name, phone, membership_status, membership_end_date")
    .order("full_name");

  if (error) {
    throw new Error(`Не удалось загрузить клиентов: ${error.message}`);
  }

  return data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    membershipStatus: row.membership_status as MembershipStatus,
    membershipEndDate: row.membership_end_date,
  }));
}

export default async function ClientsPage() {
  const [clients, expiringClients] = await Promise.all([
    getClients(),
    getExpiringClients(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Клиенты</h1>
          <p className="mt-1 text-sm text-slate-400">
            Всего клиентов: {clients.length}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {expiringClients.length > 0 && (
            <Link
              href="/reminders"
              className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-400 hover:bg-amber-500/20"
            >
              Напоминания: {expiringClients.length}
            </Link>
          )}
          <Link
            href="/clients/new"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Добавить клиента
          </Link>
        </div>
      </div>

      <ClientsList clients={clients} />
    </main>
  );
}
