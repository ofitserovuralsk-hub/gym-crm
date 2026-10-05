import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WEEKDAY_OPTIONS, formatTime, getNextClassDate } from "@/lib/status";
import ClassForm from "./class-form";
import DeleteClassButton from "./delete-class-button";
import EnrollmentPanel, {
  type ClientOption,
  type Enrollment,
} from "./enrollment-panel";

export const dynamic = "force-dynamic";

type GroupClass = {
  id: string;
  name: string;
  trainer: string | null;
  weekday: number;
  startTime: string;
  durationMinutes: number;
};

async function getClasses(): Promise<GroupClass[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("group_classes")
    .select("id, name, trainer, weekday, start_time, duration_minutes")
    .order("weekday")
    .order("start_time");

  if (error) {
    throw new Error(`Не удалось загрузить расписание: ${error.message}`);
  }

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    trainer: row.trainer,
    weekday: row.weekday,
    startTime: row.start_time,
    durationMinutes: row.duration_minutes,
  }));
}

async function getClients(): Promise<ClientOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, full_name, phone")
    .order("full_name");

  if (error) {
    throw new Error(`Не удалось загрузить клиентов: ${error.message}`);
  }

  return data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
  }));
}

// Записи только на ближайшие даты занятий — ключ "classId|date".
async function getEnrollments(
  dates: string[],
): Promise<Map<string, Enrollment[]>> {
  const result = new Map<string, Enrollment[]>();
  if (dates.length === 0) return result;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("class_enrollments")
    .select("id, class_id, class_date, client_id, clients(full_name)")
    .in("class_date", dates);

  if (error) {
    throw new Error(`Не удалось загрузить записи: ${error.message}`);
  }

  for (const row of data) {
    const key = `${row.class_id}|${row.class_date}`;
    const client = row.clients as unknown as { full_name: string } | null;
    const list = result.get(key) ?? [];
    list.push({
      id: row.id,
      clientId: row.client_id,
      clientName: client?.full_name ?? "—",
    });
    result.set(key, list);
  }
  return result;
}

// "18:00" + 60 мин -> "19:00"
function endTime(start: string, durationMinutes: number): string {
  const [h, m] = start.split(":").map(Number);
  const total = (h * 60 + m + durationMinutes) % (24 * 60);
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default async function SchedulePage() {
  const classes = await getClasses();
  const nextDates = new Map(
    classes.map((c) => [c.id, getNextClassDate(c.weekday)]),
  );
  const [clients, enrollments] = await Promise.all([
    getClients(),
    getEnrollments([...new Set(nextDates.values())]),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
        ← Все клиенты
      </Link>

      <div className="mt-4 flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Расписание</h1>
          <p className="mt-1 text-sm text-slate-400">
            Групповые занятия, повторяются каждую неделю
          </p>
        </div>
      </div>

      <div className="mt-4">
        <ClassForm />
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {WEEKDAY_OPTIONS.map((day) => {
          const dayClasses = classes.filter((c) => c.weekday === day.value);
          return (
            <section
              key={day.value}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4"
            >
              <h2 className="text-sm font-semibold text-slate-300">
                {day.label}
              </h2>
              {dayClasses.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Занятий нет</p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-800">
                  {dayClasses.map((c) => (
                    <li key={c.id} className="py-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-baseline gap-3">
                          <span className="w-28 shrink-0 text-sm tabular-nums text-emerald-400">
                            {formatTime(c.startTime)}–
                            {endTime(
                              formatTime(c.startTime),
                              c.durationMinutes,
                            )}
                          </span>
                          <span className="text-sm font-medium text-slate-100">
                            {c.name}
                          </span>
                          {c.trainer && (
                            <span className="text-sm text-slate-400">
                              {c.trainer}
                            </span>
                          )}
                        </div>
                        <DeleteClassButton id={c.id} />
                      </div>
                      <EnrollmentPanel
                        classId={c.id}
                        classDate={nextDates.get(c.id)!}
                        enrollments={
                          enrollments.get(`${c.id}|${nextDates.get(c.id)}`) ??
                          []
                        }
                        clients={clients}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
