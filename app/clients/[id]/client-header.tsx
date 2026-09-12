"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ClientForm from "../client-form";
import { deleteClient } from "../actions";
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

export default function ClientHeader({
  client,
  isOwner,
}: {
  client: Client;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleDelete() {
    setDeleteError(null);
    startDeleteTransition(async () => {
      try {
        await deleteClient(client.id);
        router.push("/");
      } catch (err) {
        setDeleteError(
          err instanceof Error ? err.message : "Не удалось удалить клиента"
        );
      }
    });
  }

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
              {isOwner && !isConfirmingDelete && (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="rounded-lg border border-red-900 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-950"
                >
                  Удалить
                </button>
              )}
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

          {isConfirmingDelete && (
            <div className="mt-3 rounded-lg border border-red-900 bg-red-950/40 p-3">
              <p className="text-sm text-red-300">
                Удалить клиента «{client.fullName}» вместе со всей историей
                (абонементы, оплаты, посещения)? Это необратимо.
              </p>
              {deleteError && (
                <p className="mt-2 text-sm text-red-400">{deleteError}</p>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {isDeleting ? "Удаление…" : "Да, удалить"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirmingDelete(false);
                    setDeleteError(null);
                  }}
                  disabled={isDeleting}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
