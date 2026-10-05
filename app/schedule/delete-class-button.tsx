"use client";

import { useState, useTransition } from "react";
import { deleteGroupClass } from "./actions";

export default function DeleteClassButton({ id }: { id: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm("Удалить это занятие из расписания?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteGroupClass(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось удалить");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="text-xs text-slate-500 hover:text-red-400 disabled:opacity-50"
      >
        Удалить
      </button>
      {error && <span className="ml-2 text-xs text-red-400">{error}</span>}
    </>
  );
}
