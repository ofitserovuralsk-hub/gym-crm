"use client";

import { useState, useTransition } from "react";
import { deleteTrainer } from "./actions";

export default function DeleteTrainerButton({
  id,
  classCount,
}: {
  id: string;
  classCount: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const note =
      classCount > 0
        ? ` Он назначен на занятий в неделю: ${classCount}, они останутся без тренера.`
        : "";
    if (!window.confirm(`Удалить тренера?${note}`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteTrainer(id);
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
