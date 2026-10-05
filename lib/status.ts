export type MembershipStatus = "active" | "expired" | "frozen";

export const STATUS_LABEL: Record<MembershipStatus, string> = {
  active: "Активен",
  expired: "Истёк",
  frozen: "Заморожен",
};

export const STATUS_STYLE: Record<MembershipStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  expired: "bg-red-500/15 text-red-400 ring-red-500/30",
  frozen: "bg-sky-500/15 text-sky-400 ring-sky-500/30",
};

export const SUBSCRIPTION_TYPE_OPTIONS = [
  { value: "unlimited", label: "Безлимит" },
  { value: "single", label: "Разовый" },
  { value: "sessions", label: "N занятий" },
] as const;

export const SUBSCRIPTION_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  SUBSCRIPTION_TYPE_OPTIONS.map((opt) => [opt.value, opt.label])
);

export const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Наличные" },
  { value: "card", label: "Карта" },
  { value: "kaspi", label: "Kaspi" },
] as const;

export const PAYMENT_METHOD_LABEL: Record<string, string> = Object.fromEntries(
  PAYMENT_METHOD_OPTIONS.map((opt) => [opt.value, opt.label])
);

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("ru-RU")} ₸`;
}

// Зал находится в Уральске — фиксируем часовой пояс явно, чтобы даты не
// сдвигались из-за таймзоны сервера (в проде это может быть UTC, локально — другая).
export const GYM_TIME_ZONE = "Asia/Oral";

export function getGymToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: GYM_TIME_ZONE });
}

export function formatDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: GYM_TIME_ZONE,
  });
}

export function formatDateTime(isoDateTime: string | null): string {
  if (!isoDateTime) return "—";
  return new Date(isoDateTime).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: GYM_TIME_ZONE,
  });
}

// ISO-дни недели (1 = понедельник) для расписания групповых занятий.
export const WEEKDAY_OPTIONS = [
  { value: 1, label: "Понедельник" },
  { value: 2, label: "Вторник" },
  { value: 3, label: "Среда" },
  { value: 4, label: "Четверг" },
  { value: 5, label: "Пятница" },
  { value: 6, label: "Суббота" },
  { value: 7, label: "Воскресенье" },
] as const;

// Postgres `time` приходит как "HH:MM:SS" — для показа обрезаем до "HH:MM".
export function formatTime(time: string): string {
  return time.slice(0, 5);
}

// Ближайшая дата (включая сегодня) для занятия, которое идёт в заданный
// ISO-день недели. Считаем в таймзоне зала, арифметика — в UTC, чтобы не
// зависеть от таймзоны сервера.
export function getNextClassDate(weekday: number): string {
  const today = new Date(`${getGymToday()}T00:00:00Z`);
  const todayWeekday = today.getUTCDay() === 0 ? 7 : today.getUTCDay();
  const diff = (weekday - todayWeekday + 7) % 7;
  today.setUTCDate(today.getUTCDate() + diff);
  return today.toISOString().slice(0, 10);
}
