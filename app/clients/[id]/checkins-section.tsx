"use client";

import { useState, useTransition } from "react";
import { formatDateTime } from "@/lib/status";
import { addCheckIn } from "./actions";

type CheckIn = {
  id: string;
  checkedInAt: string | null;
};

export default function CheckInsSection({
  clientId,
  checkIns,
}: {
  clientId: string;
  checkIns: CheckIn[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCheckIn() {
    setError(null);
    startTransition(async () => {
      try {
        await addCheckIn(clientId);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Не удалось отметить приход"
        );
      }
    });
  }

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Посещения</h2>
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={isPending}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {isPending ? "Отмечаем…" : "Отметить приход"}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-4 py-2 font-medium">Дата и время</th>
            </tr>
          </thead>
          <tbody>
            {checkIns.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-center text-slate-500">
                  Посещений пока нет
                </td>
              </tr>
            ) : (
              checkIns.map((checkIn) => (
                <tr key={checkIn.id} className="border-t border-slate-800">
                  <td className="px-4 py-2">
                    {formatDateTime(checkIn.checkedInAt)}
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
