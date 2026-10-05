import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WEEKDAY_OPTIONS, formatTime } from "@/lib/status";
import TrainerForm from "./trainer-form";
import DeleteTrainerButton from "./delete-trainer-button";

export const dynamic = "force-dynamic";

type TrainerClass = {
  weekday: number;
  startTime: string;
  name: string;
};

type Trainer = {
  id: string;
  fullName: string;
  phone: string | null;
  classes: TrainerClass[];
};

async function getTrainers(): Promise<Trainer[]> {
  const supabase = createClient();
  const [trainersRes, classesRes] = await Promise.all([
    supabase.from("trainers").select("id, full_name, phone").order("full_name"),
    supabase
      .from("group_classes")
      .select("trainer_id, name, weekday, start_time")
      .not("trainer_id", "is", null)
      .order("weekday")
      .order("start_time"),
  ]);

  if (trainersRes.error) {
    throw new Error(`Не удалось загрузить тренеров: ${trainersRes.error.message}`);
  }
  if (classesRes.error) {
    throw new Error(`Не удалось загрузить занятия: ${classesRes.error.message}`);
  }

  return trainersRes.data.map((t) => ({
    id: t.id,
    fullName: t.full_name,
    phone: t.phone,
    classes: classesRes.data
      .filter((c) => c.trainer_id === t.id)
      .map((c) => ({
        weekday: c.weekday,
        startTime: c.start_time,
        name: c.name,
      })),
  }));
}

export default async function TrainersPage() {
  const trainers = await getTrainers();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
        ← Все клиенты
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Тренеры</h1>
      <p className="mt-1 text-sm text-slate-400">
        Всего тренеров: {trainers.length}. Назначаются на занятия в{" "}
        <Link href="/schedule" className="text-emerald-400 hover:text-emerald-300">
          расписании
        </Link>
        .
      </p>

      <div className="mt-4">
        <TrainerForm />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {trainers.length === 0 ? (
          <p className="text-sm text-slate-500">Тренеров пока нет</p>
        ) : (
          trainers.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-100">{t.fullName}</p>
                  <p className="text-sm text-slate-400">{t.phone ?? "—"}</p>
                </div>
                <DeleteTrainerButton id={t.id} classCount={t.classes.length} />
              </div>
              {t.classes.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {t.classes.map((c, i) => (
                    <li
                      key={i}
                      className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                    >
                      {WEEKDAY_OPTIONS.find((d) => d.value === c.weekday)?.label.slice(0, 2)}{" "}
                      {formatTime(c.startTime)} · {c.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
