import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  formatDate,
  formatCurrency,
  getGymToday,
  GYM_TIME_ZONE,
  PAYMENT_METHOD_LABEL,
  STATUS_LABEL,
  type MembershipStatus,
} from "@/lib/status";

export const dynamic = "force-dynamic";

const MONTHS_BACK = 6;

type Payment = {
  amount: number;
  method: string;
  paidAt: string;
};

type ClientRow = {
  id: string;
  fullName: string;
  phone: string;
  membershipStatus: MembershipStatus;
  membershipEndDate: string | null;
};

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function monthLabel(key: string): string {
  const label = new Date(`${key}-01T00:00:00Z`).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
    timeZone: GYM_TIME_ZONE,
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function lastMonthKeys(count: number): string[] {
  const today = getGymToday();
  const [year, month] = today.split("-").map(Number);
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    keys.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
    );
  }
  return keys;
}

async function getPayments(): Promise<Payment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("amount, method, paid_at");

  if (error) {
    throw new Error(`Не удалось загрузить оплаты: ${error.message}`);
  }

  return data.map((row) => ({
    amount: Number(row.amount),
    method: row.method,
    paidAt: row.paid_at,
  }));
}

async function getClients(): Promise<ClientRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, full_name, phone, membership_status, membership_end_date");

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

export default async function AnalyticsPage() {
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== "owner") {
    redirect("/");
  }

  const [payments, clients] = await Promise.all([
    getPayments(),
    getClients(),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  const revenueByMethod = payments.reduce<Record<string, number>>(
    (acc, p) => {
      acc[p.method] = (acc[p.method] ?? 0) + p.amount;
      return acc;
    },
    {}
  );

  const months = lastMonthKeys(MONTHS_BACK);
  const revenueByMonth = months.map((key) => ({
    key,
    total: payments
      .filter((p) => monthKey(p.paidAt) === key)
      .reduce((sum, p) => sum + p.amount, 0),
  }));

  const totalClients = clients.length;
  const statusCounts: Record<MembershipStatus, number> = {
    active: 0,
    expired: 0,
    frozen: 0,
  };
  for (const c of clients) {
    statusCounts[c.membershipStatus]++;
  }

  const churnedClients = clients
    .filter((c) => c.membershipStatus === "expired")
    .sort((a, b) =>
      (b.membershipEndDate ?? "").localeCompare(a.membershipEndDate ?? "")
    )
    .slice(0, 10);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
        ← Все клиенты
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Аналитика</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Выручка</h2>

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Всего за всё время</p>
            <p className="mt-1 text-2xl font-semibold">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          {Object.entries(revenueByMethod).length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:col-span-2">
              <p className="text-sm text-slate-500">Оплат пока нет</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:col-span-2">
              <p className="text-sm text-slate-400">По способу оплаты</p>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                {Object.entries(revenueByMethod).map(([method, sum]) => (
                  <p key={method} className="text-sm">
                    {PAYMENT_METHOD_LABEL[method] ?? method}:{" "}
                    <span className="font-medium">{formatCurrency(sum)}</span>
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Месяц</th>
                <th className="px-4 py-2 font-medium">Выручка</th>
              </tr>
            </thead>
            <tbody>
              {revenueByMonth.map((row) => (
                <tr key={row.key} className="border-t border-slate-800">
                  <td className="px-4 py-2">{monthLabel(row.key)}</td>
                  <td className="px-4 py-2">{formatCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Клиенты и отток</h2>

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Всего клиентов</p>
            <p className="mt-1 text-2xl font-semibold">{totalClients}</p>
          </div>
          {(["active", "expired", "frozen"] as MembershipStatus[]).map(
            (status) => {
              const count = statusCounts[status];
              const percent = totalClients
                ? Math.round((count / totalClients) * 100)
                : 0;
              return (
                <div
                  key={status}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-4"
                >
                  <p className="text-sm text-slate-400">
                    {STATUS_LABEL[status]}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {count}{" "}
                    <span className="text-sm font-normal text-slate-500">
                      ({percent}%)
                    </span>
                  </p>
                </div>
              );
            }
          )}
        </div>

        <div className="mt-4">
          <p className="text-sm text-slate-400">
            Недавно истёкшие абонементы — кандидаты на возврат
          </p>
          <div className="mt-2 overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Клиент</th>
                  <th className="px-4 py-2 font-medium">Телефон</th>
                  <th className="px-4 py-2 font-medium">Истёк</th>
                </tr>
              </thead>
              <tbody>
                {churnedClients.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-4 text-center text-slate-500"
                    >
                      Никто не истёк — отлично
                    </td>
                  </tr>
                ) : (
                  churnedClients.map((c) => (
                    <tr key={c.id} className="border-t border-slate-800">
                      <td className="px-4 py-2">
                        <Link
                          href={`/clients/${c.id}`}
                          className="hover:underline"
                        >
                          {c.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-2">{c.phone}</td>
                      <td className="px-4 py-2">
                        {formatDate(c.membershipEndDate)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
