"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addTrainer(data: { fullName: string; phone: string }) {
  const supabase = createClient();
  const { error } = await supabase.from("trainers").insert({
    full_name: data.fullName.trim(),
    phone: data.phone.trim() || null,
  });

  if (error) {
    throw new Error(`Не удалось добавить тренера: ${error.message}`);
  }

  revalidatePath("/trainers");
  revalidatePath("/schedule");
}

export async function deleteTrainer(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("trainers").delete().eq("id", id);

  if (error) {
    throw new Error(`Не удалось удалить тренера: ${error.message}`);
  }

  revalidatePath("/trainers");
  revalidatePath("/schedule");
}
