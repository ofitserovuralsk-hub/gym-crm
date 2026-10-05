// Очередь чек-инов, сделанных без сети. Хранится в IndexedDB на устройстве,
// пока не появится соединение и запись не уедет в Supabase через
// addCheckIn (см. app/offline-sync.tsx — там фактическая синхронизация).

const DB_NAME = "gym-crm-offline";
const DB_VERSION = 1;
const STORE_NAME = "pending_checkins";

export type QueuedCheckIn = {
  id: string;
  clientId: string;
  queuedAt: string;
};

function isSupported(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const request = fn(tx.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

export async function queueCheckIn(clientId: string): Promise<QueuedCheckIn> {
  if (!isSupported()) {
    throw new Error("Офлайн-режим не поддерживается этим браузером");
  }
  const entry: QueuedCheckIn = {
    id: crypto.randomUUID(),
    clientId,
    queuedAt: new Date().toISOString(),
  };
  await withStore("readwrite", (store) => store.add(entry));
  return entry;
}

export async function getQueuedCheckIns(
  clientId?: string
): Promise<QueuedCheckIn[]> {
  if (!isSupported()) return [];
  const all = await withStore<QueuedCheckIn[]>("readonly", (store) =>
    store.getAll()
  );
  if (!clientId) return all;
  return all.filter((item) => item.clientId === clientId);
}

async function removeQueuedCheckIn(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id));
}

let isSyncing = false;

// Пытается по одному отправить все накопленные офлайн-чек-ины через переданный
// Server Action. Останавливается на первой ошибке (скорее всего снова нет
// сети) — остальное досинхронизируется при следующей попытке.
export async function syncQueuedCheckIns(
  submit: (clientId: string) => Promise<void>
): Promise<{ synced: number }> {
  if (!isSupported() || isSyncing) return { synced: 0 };
  isSyncing = true;
  try {
    const queue = await getQueuedCheckIns();
    let synced = 0;
    for (const item of queue) {
      try {
        await submit(item.clientId);
        await removeQueuedCheckIn(item.id);
        synced += 1;
      } catch {
        break;
      }
    }
    return { synced };
  } finally {
    isSyncing = false;
  }
}
