"use client";

import { useState, useTransition } from "react";
import { ROLE_LABEL } from "@/lib/status";
import type { Role } from "@/lib/auth";
import { changeStaffRole, deleteStaff, resetStaffPassword } from "./actions";
import { generatePassword } from "./password-field";

export default function StaffRowActions({
  userId,
  email,
  role,
  isSelf,
}: {
  userId: string;
  email: string;
  role: Role;
  isSelf: boolean;
}) {
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <select
          value={role}
          disabled={isSelf || isPending}
          onChange={(e) =>
            run(() => changeStaffRole(userId, e.target.value as Role))
          }
          title={isSelf ? "Свою роль менять нельзя" : undefined}
          className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 disabled:opacity-50"
        >
          <option value="admin">{ROLE_LABEL.admin}</option>
          <option value="owner">{ROLE_LABEL.owner}</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setIsResetOpen((open) => !open);
            setNewPassword(null);
          }}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          Сменить пароль
        </button>
        {!isSelf && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (!window.confirm(`Удалить сотрудника ${email}? Он больше не сможет войти.`)) return;
              run(() => deleteStaff(userId));
            }}
            className="text-xs text-slate-500 hover:text-red-400 disabled:opacity-50"
          >
            Удалить
          </button>
        )}
      </div>

      {isResetOpen && (
        <div className="flex flex-wrap items-center justify-end gap-1">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            placeholder="Новый пароль"
            className="w-44 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-xs text-slate-100"
          />
          <button
            type="button"
            onClick={() => setPassword(generatePassword())}
            className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            Сгенерировать
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              run(async () => {
                await resetStaffPassword(userId, password);
                setNewPassword(password);
                setPassword("");
                setIsResetOpen(false);
              })
            }
            className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Сохранить
          </button>
        </div>
      )}

      {newPassword && (
        <p className="text-xs text-emerald-300">
          Новый пароль: <span className="font-mono">{newPassword}</span> —
          передайте сотруднику
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
