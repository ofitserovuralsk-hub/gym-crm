"use client";

import { useEffect, useState, useTransition } from "react";
import { formatDateTime } from "@/lib/status";
import { addCheckIn } from "./actions";
import {
  getQueuedCheckIns,
  queueCheckIn,
  type QueuedCheckIn,
} from "@/lib/offline-queue";

type CheckIn = {
  id: string;
  checkedInAt: string | null;
};

// Ошибка сети (нет соединения) отличается от ошибки самого Server Action:
// fetch в браузере кидает TypeError, когда запрос вообще не смог уйти.
function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  return err instanceof TypeError;
}

export default function CheckInsSection({
  clientId,
  checkIns,
}: {
  clientId: string;
  checkIns: CheckIn[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<QueuedCheckIn[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function refreshPending() {
      getQueuedCheckIns(clientId).then(setPending);
    }
    refreshPending();
    window.addEventListener("offline-queue-synced", refreshPending);
    return () =>
      window.removeEventListener("offline-queue-synced", refreshPending);
  }, [clientId]);

  function handleCheckIn() {
    setError(null);
    startTransition(async () => {
      try {
        await addCheckIn(clientId);
      } catch (err) {
        if (isNetworkError(err)) {
          const queued = await queueCheckIn(clientId);
          setPending((prev) => [queued, ...prev]);
          return;
        }
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
            {checkIns.length === 0 && pending.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-center text-slate-500">
                  Посещений пока нет
                </td>
              </tr>
            ) : (
              <>
                {pending.map((item) => (
                  <tr key={item.id} className="border-t border-slate-800">
                    <td className="px-4 py-2">
                      <span className="text-slate-300">
                        {formatDateTime(item.queuedAt)}
                      </span>{" "}
                      <span className="ml-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400 ring-1 ring-amber-500/30">
                        офлайн · ждёт синхронизации
                      </span>
                    </td>
                  </tr>
                ))}
                {checkIns.map((checkIn) => (
                  <tr key={checkIn.id} className="border-t border-slate-800">
                    <td className="px-4 py-2">
                      {formatDateTime(checkIn.checkedInAt)}
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
