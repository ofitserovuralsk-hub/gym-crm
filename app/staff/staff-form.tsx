"use client";

import { useState, useTransition } from "react";
import { ROLE_LABEL } from "@/lib/status";
import type { Role } from "@/lib/auth";
import { createStaff } from "./actions";
import { generatePassword } from "./password-field";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100";

export default function StaffForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("admin");
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createStaff({ email, password, role });
        // Пароль показываем один раз — потом его нигде не увидеть.
        setCreated({ email: email.trim().toLowerCase(), password });
        setEmail("");
        setPassword("");
        setRole("admin");
        setIsOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось создать");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open);
          setCreated(null);
        }}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
      >
        {isOpen ? "Отмена" : "Добавить сотрудника"}
      </button>

      {created && (
        <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
          <p className="font-medium text-emerald-300">Сотрудник создан</p>
          <p className="mt-1 text-slate-200">
            Логин: <span className="font-mono">{created.email}</span>
          </p>
          <p className="text-slate-200">
            Пароль: <span className="font-mono">{created.password}</span>
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Передайте пароль сотруднику. Больше он нигде не отображается — при
            утере его можно только сбросить.
          </p>
        </div>
      )}

      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-sm text-slate-300">
              Email (логин)
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                className={inputClass}
              />
            </label>
            <label className="text-sm text-slate-300">
              Пароль (от 10 символов)
              <div className="mt-1 flex gap-1">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 font-mono text-sm text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setPassword(generatePassword())}
                  className="shrink-0 rounded-lg border border-slate-700 px-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Сгенерировать
                </button>
              </div>
            </label>
            <label className="text-sm text-slate-300">
              Роль
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className={inputClass}
              >
                <option value="admin">{ROLE_LABEL.admin}</option>
                <option value="owner">{ROLE_LABEL.owner}</option>
              </select>
            </label>
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {isPending ? "Создание…" : "Создать"}
          </button>
        </form>
      )}
    </div>
  );
}
