"use client";

import { useState } from "react";
import ClientForm from "../client-form";
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
  birthDate: string | null;
  photoUrl: string | null;
  membershipStatus: MembershipStatus;
  membershipEndDate: string | null;
};

export default function ClientHeader({ client }: { client: Client }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <ClientForm
        mode="edit"
        clientId={client.id}
        initialValues={{
          fullName: client.fullName,
          phone: client.phone,
          birthDate: client.birthDate,
          photoUrl: client.photoUrl,
        }}
        onSaved={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
      <div className="flex items-start gap-4">
        {client.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={client.photoUrl}
            alt={client.fullName}
            className="h-40 w-40 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-700 text-xs text-slate-500">
            Нет фото
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-semibold">{client.fullName}</h1>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                  STATUS_STYLE[client.membershipStatus]
                }`}
              >
                {STATUS_LABEL[client.membershipStatus]}
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Редактировать
              </button>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-400">{client.phone}</p>
          {client.birthDate && (
            <p className="mt-1 text-sm text-slate-400">
              Дата рождения: {formatDate(client.birthDate)}
            </p>
          )}
          <p className="mt-3 text-sm text-slate-300">
            Абонемент до:{" "}
            <span className="font-medium">
              {formatDate(client.membershipEndDate)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
