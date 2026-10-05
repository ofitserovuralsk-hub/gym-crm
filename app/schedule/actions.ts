"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addGroupClass(data: {
  name: string;
  trainer: string;
  weekday: number;
  startTime: string;
  durationMinutes: number;
}) {
  const supabase = createClient();
  const { error } = await supabase.from("group_classes").insert({
    name: data.name.trim(),
    trainer: data.trainer.trim() || null,
    weekday: data.weekday,
    start_time: data.startTime,
    duration_minutes: data.durationMinutes,
  });

  if (error) {
    throw new Error(`Не удалось добавить занятие: ${error.message}`);
  }

  revalidatePath("/schedule");
}

export async function deleteGroupClass(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("group_classes").delete().eq("id", id);

  if (error) {
    throw new Error(`Не удалось удалить занятие: ${error.message}`);
  }

  revalidatePath("/schedule");
}
