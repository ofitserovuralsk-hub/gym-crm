"use client";

import { useState, useTransition } from "react";
import { WEEKDAY_OPTIONS } from "@/lib/status";
import { addGroupClass } from "./actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
// Шаг 5 минут — хватает и для "18:00", и для нестандартных "18:10".
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0")
);

export default function ClassForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [trainer, setTrainer] = useState("");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("00");
  const [duration, setDuration] = useState("60");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setTrainer("");
    setWeekdays([]);
    setHour("");
    setMinute("00");
    setDuration("60");
    setError(null);
  }

  function toggleWeekday(value: number) {
    setWeekdays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const durationValue = Number(duration);
    if (!name.trim()) {
      setError("Укажите название занятия");
      return;
    }
    if (weekdays.length === 0) {
      setError("Выберите хотя бы один день недели");
      return;
    }
    if (!hour) {
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
          weekdays,
          startTime: `${hour}:${minute}`,
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className="text-sm text-slate-300">
              Начало
              <div className="mt-1 flex items-center gap-1">
                <select
                  aria-label="Час"
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
                >
                  <option value="">чч</option>
                  {HOURS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <span>:</span>
                <select
                  aria-label="Минуты"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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

          <fieldset className="mt-4">
            <legend className="text-sm text-slate-300">Дни недели</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {WEEKDAY_OPTIONS.map((opt) => {
                const checked = weekdays.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
                      checked
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                        : "border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleWeekday(opt.value)}
                      className="accent-emerald-500"
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

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
