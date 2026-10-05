"use client";

import { useState, useTransition } from "react";
import { formatDate, type MembershipStatus } from "@/lib/status";
import { enrollClient, unenrollClient } from "./actions";

export type Enrollment = {
  id: string;
  clientId: string;
  clientName: string;
};

export type ClientOption = {
  id: string;
  fullName: string;
  phone: string;
  membershipStatus: MembershipStatus;
  membershipEndDate: string | null;
};

// Запись не блокируем (решает администратор), но предупреждаем.
function getMembershipWarning(
  client: ClientOption,
  classDate: string,
): string | null {
  if (client.membershipStatus === "expired") return "абонемент истёк";
  if (client.membershipStatus === "frozen") return "абонемент заморожен";
  if (client.membershipEndDate && client.membershipEndDate < classDate) {
    return `абонемент закончится ${formatDate(client.membershipEndDate)}`;
  }
  return null;
}

export default function EnrollmentPanel({
  classId,
  classDate,
  enrollments,
  clients,
}: {
  classId: string;
  classDate: string;
  enrollments: Enrollment[];
  clients: ClientOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const enrolledIds = new Set(enrollments.map((e) => e.clientId));
  const normalized = query.trim().toLowerCase();
  const matches = normalized
    ? clients
        .filter(
          (c) =>
            !enrolledIds.has(c.id) &&
            (c.fullName.toLowerCase().includes(normalized) ||
              c.phone.includes(normalized)),
        )
        .slice(0, 5)
    : [];

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось выполнить");
      }
    });
  }

  return (
    <div className="mt-2 pl-0 sm:pl-32">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="text-xs text-slate-400 hover:text-slate-200"
      >
        {formatDate(classDate)} · записано: {enrollments.length}{" "}
        {isOpen ? "▲" : "▼"}
      </button>

      {isOpen && (
        <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950 p-3">
          {enrollments.length === 0 ? (
            <p className="text-sm text-slate-500">Пока никто не записан</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {enrollments.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 py-1.5 text-sm"
                >
                  <span className="text-slate-200">{e.clientName}</span>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => run(() => unenrollClient(e.id))}
                    className="text-xs text-slate-500 hover:text-red-400 disabled:opacity-50"
                  >
                    Отменить
                  </button>
                </li>
              ))}
            </ul>
          )}

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти клиента по имени или телефону"
            className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
          />
          {matches.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {matches.map((c) => {
                const warning = getMembershipWarning(c, classDate);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        if (
                          warning &&
                          !window.confirm(
                            `У клиента ${warning}. Всё равно записать?`,
                          )
                        ) {
                          return;
                        }
                        run(async () => {
                          await enrollClient(classId, c.id, classDate);
                          setQuery("");
                        });
                      }}
                      className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                    >
                      {c.fullName}{" "}
                      <span className="text-slate-500">{c.phone}</span>
                      {warning && (
                        <span className="ml-2 text-xs text-amber-400">
                          ⚠ {warning}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {normalized && matches.length === 0 && (
            <p className="mt-2 text-xs text-slate-500">Никого не найдено</p>
          )}
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
