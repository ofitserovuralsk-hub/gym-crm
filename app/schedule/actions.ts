"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addGroupClass(data: {
  name: string;
  trainer: string;
  weekdays: number[];
  startTime: string;
  durationMinutes: number;
}) {
  const supabase = createClient();
  // По одной строке на каждый выбранный день недели.
  const { error } = await supabase.from("group_classes").insert(
    data.weekdays.map((weekday) => ({
      name: data.name.trim(),
      trainer: data.trainer.trim() || null,
      weekday,
      start_time: data.startTime,
      duration_minutes: data.durationMinutes,
    }))
  );

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

export async function enrollClient(
  classId: string,
  clientId: string,
  classDate: string
) {
  const supabase = createClient();
  const { error } = await supabase.from("class_enrollments").insert({
    class_id: classId,
    client_id: clientId,
    class_date: classDate,
  });

  if (error) {
    // 23505 — нарушение unique (class_id, client_id, class_date)
    if (error.code === "23505") {
      throw new Error("Клиент уже записан на это занятие");
    }
    throw new Error(`Не удалось записать клиента: ${error.message}`);
  }

  revalidatePath("/schedule");
}

export async function unenrollClient(enrollmentId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("class_enrollments")
    .delete()
    .eq("id", enrollmentId);

  if (error) {
    throw new Error(`Не удалось отменить запись: ${error.message}`);
  }

  revalidatePath("/schedule");
}
