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

// Зал находится в Уральске — фиксируем часовой пояс явно, чтобы даты не
// сдвигались из-за таймзоны сервера (в проде это может быть UTC, локально — другая).
const GYM_TIME_ZONE = "Asia/Oral";

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
