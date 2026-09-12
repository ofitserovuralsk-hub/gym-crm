import { supabase } from "@/lib/supabase";
import { getGymToday } from "@/lib/status";

export const REMINDER_WINDOW_DAYS = 7;

export type ExpiringClient = {
  id: string;
  fullName: string;
  phone: string;
  membershipEndDate: string;
};

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

export async function getExpiringClients(): Promise<ExpiringClient[]> {
  const todayStr = getGymToday();
  const untilStr = addDays(todayStr, REMINDER_WINDOW_DAYS);

  const { data, error } = await supabase
    .from("clients")
    .select("id, full_name, phone, membership_end_date")
    .eq("membership_status", "active")
    .gte("membership_end_date", todayStr)
    .lte("membership_end_date", untilStr)
    .order("membership_end_date");

  if (error) {
    throw new Error(`Не удалось загрузить напоминания: ${error.message}`);
  }

  return data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    membershipEndDate: row.membership_end_date,
  }));
}
