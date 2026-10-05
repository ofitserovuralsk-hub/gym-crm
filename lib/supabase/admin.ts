import { createClient } from "@supabase/supabase-js";

// Клиент с service_role: обходит RLS и умеет управлять пользователями Auth.
// Ключ НЕ публичный — только серверный код (Server Actions / Server Components),
// переменная без префикса NEXT_PUBLIC_, в браузерный бандл не попадает.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Не задан SUPABASE_SERVICE_ROLE_KEY (нужен для управления сотрудниками)"
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
