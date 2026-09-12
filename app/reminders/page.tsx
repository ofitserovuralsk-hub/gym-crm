import Link from "next/link";
import { formatDate, getGymToday } from "@/lib/status";
import { REMINDER_WINDOW_DAYS, getExpiringClients } from "@/lib/reminders";

export const dynamic = "force-dynamic";

function daysUntil(dateStr: string): number {
  const end = new Date(`${dateStr}T00:00:00Z`).getTime();
  const today = new Date(`${getGymToday()}T00:00:00Z`).getTime();
  return Math.round((end - today) / (1000 * 60 * 60 * 24));
}

function daysWord(n: number): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return "дней";
  if (last === 1) return "день";
  if (last >= 2 && last <= 4) return "дня";
  return "дней";
}

export default async function RemindersPage() {
  const clients = await getExpiringClients();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
        ← Все клиенты
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Напоминания</h1>
      <p className="mt-1 text-sm text-slate-400">
        Абонемент истекает в ближайшие {REMINDER_WINDOW_DAYS} дней
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {clients.length === 0 ? (
          <p className="text-sm text-slate-500">
            Пока никто не истекает в ближайшие {REMINDER_WINDOW_DAYS} дней
          </p>
        ) : (
          clients.map((client) => {
            const days = daysUntil(client.membershipEndDate);
            return (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm transition hover:border-slate-700"
              >
                <div>
                  <h2 className="text-base font-medium">{client.fullName}</h2>
                  <p className="mt-1 text-sm text-slate-400">{client.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-amber-400">
                    {days <= 0
                      ? "истекает сегодня"
                      : `через ${days} ${daysWord(days)}`}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    до {formatDate(client.membershipEndDate)}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </main>
  );
}
