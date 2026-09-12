"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  STATUS_LABEL,
  STATUS_STYLE,
  formatDate,
  type MembershipStatus,
} from "@/lib/status";

type Client = {
  id: string;
  fullName: string;
  phone: string;
  membershipStatus: MembershipStatus;
  membershipEndDate: string | null;
};

const STATUS_FILTERS: { value: MembershipStatus | "all"; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "active", label: STATUS_LABEL.active },
  { value: "expired", label: STATUS_LABEL.expired },
  { value: "frozen", label: STATUS_LABEL.frozen },
];

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export default function ClientsList({ clients }: { clients: Client[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | "all">(
    "all"
  );

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();
    const queryDigits = onlyDigits(search);

    return clients.filter((client) => {
      const matchesStatus =
        statusFilter === "all" || client.membershipStatus === statusFilter;

      const matchesSearch =
        query === "" ||
        client.fullName.toLowerCase().includes(query) ||
        (queryDigits !== "" && onlyDigits(client.phone).includes(queryDigits));

      return matchesStatus && matchesSearch;
    });
  }, [clients, search, statusFilter]);

  return (
    <>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени или телефону…"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 sm:max-w-xs"
        />

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition ${
                statusFilter === filter.value
                  ? "bg-slate-100 text-slate-900 ring-slate-100"
                  : "text-slate-300 ring-slate-700 hover:bg-slate-800"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Найдено: {filteredClients.length}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredClients.length === 0 ? (
          <p className="col-span-full text-center text-sm text-slate-500">
            Ничего не найдено
          </p>
        ) : (
          filteredClients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm transition hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-medium">{client.fullName}</h2>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                    STATUS_STYLE[client.membershipStatus]
                  }`}
                >
                  {STATUS_LABEL[client.membershipStatus]}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-400">{client.phone}</p>

              <p className="mt-3 text-sm text-slate-300">
                Абонемент до:{" "}
                <span className="font-medium">
                  {formatDate(client.membershipEndDate)}
                </span>
              </p>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
