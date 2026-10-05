"use client";

import { useState, useTransition } from "react";
import { WEEKDAY_OPTIONS } from "@/lib/status";
import { addGroupClass } from "./actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100";

export default function ClassForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [trainer, setTrainer] = useState("");
  const [weekday, setWeekday] = useState<number>(1);
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setTrainer("");
    setWeekday(1);
    setStartTime("");
    setDuration("60");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const durationValue = Number(duration);
    if (!name.trim()) {
      setError("Укажите название занятия");
      return;
    }
    if (!startTime) {
      setError("Укажите время начала");
      return;
    }
    if (!durationValue || durationValue <= 0) {
      setError("Длительность должна быть больше нуля");
      return;
    }

    startTransition(async () => {
      try {
        await addGroupClass({
          name,
          trainer,
          weekday,
          startTime,
          durationMinutes: durationValue,
        });
        reset();
        setIsOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось сохранить");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
      >
        {isOpen ? "Отмена" : "Добавить занятие"}
      </button>

      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-sm text-slate-300">
              Название
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Йога, Пилатес…"
                className={inputClass}
              />
            </label>
            <label className="text-sm text-slate-300">
              Тренер
              <input
                value={trainer}
                onChange={(e) => setTrainer(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm text-slate-300">
              День недели
              <select
                value={weekday}
                onChange={(e) => setWeekday(Number(e.target.value))}
                className={inputClass}
              >
                {WEEKDAY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-300">
              Начало
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm text-slate-300">
              Длительность (мин)
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {isPending ? "Сохранение…" : "Сохранить"}
          </button>
        </form>
      )}
    </div>
  );
}
