"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { syncQueuedCheckIns } from "@/lib/offline-queue";
import { addCheckIn } from "./clients/[id]/actions";

// Глобальный компонент без UI: смонтирован в layout, следит за сетью и
// досылает чек-ины, накопленные офлайн в IndexedDB (lib/offline-queue.ts),
// как только соединение появляется — независимо от того, на какой странице
// сейчас пользователь.
export default function OfflineSync() {
  const router = useRouter();

  useEffect(() => {
    async function flush() {
      const { synced } = await syncQueuedCheckIns(addCheckIn);
      if (synced > 0) {
        window.dispatchEvent(new CustomEvent("offline-queue-synced"));
        router.refresh();
      }
    }

    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [router]);

  return null;
}
