"use client";

import { useState, useTransition } from "react";
import {
  formatDate,
  STATUS_LABEL,
  SUBSCRIPTION_TYPE_OPTIONS,
  SUBSCRIPTION_TYPE_LABEL,
} from "@/lib/status";
import { addSubscription } from "./actions";

type Subscription = {
  id: string;
  type: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
};

export default function SubscriptionsSection({
  clientId,
  subscriptions,
}: {
  clientId: string;
  subscriptions: Subscription[];
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [type, setType] = useState<string>(SUBSCRIPTION_TYPE_OPTIONS[0].value);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setType(SUBSCRIPTION_TYPE_OPTIONS[0].value);
    setStartDate("");
    setEndDate("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError("Укажите даты начала и окончания");
      return;
    }

    startTransition(async () => {
      try {
        await addSubscription(clientId, { type, startDate, endDate });
        resetForm();
        setIsFormOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось сохранить");
      }
    });
  }

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Абонементы</h2>
        <button
          type="button"
          onClick={() => setIsFormOpen((open) => !open)}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
        >
          {isFormOpen ? "Отмена" : "Добавить абонемент"}
        </button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-sm text-slate-300">
              Тип
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
              >
                {SUBSCRIPTION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-slate-300">
              Дата начала
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
              />
            </label>

            <label className="text-sm text-slate-300">
              Дата окончания
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
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

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-4 py-2 font-medium">Тип</th>
              <th className="px-4 py-2 font-medium">Начало</th>
              <th className="px-4 py-2 font-medium">Окончание</th>
              <th className="px-4 py-2 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-slate-500">
                  Абонементов пока нет
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => (
                <tr key={sub.id} className="border-t border-slate-800">
                  <td className="px-4 py-2">{SUBSCRIPTION_TYPE_LABEL[sub.type] ?? sub.type}</td>
                  <td className="px-4 py-2">{formatDate(sub.startDate)}</td>
                  <td className="px-4 py-2">{formatDate(sub.endDate)}</td>
                  <td className="px-4 py-2">
                    {STATUS_LABEL[sub.status as keyof typeof STATUS_LABEL] ??
                      sub.status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
