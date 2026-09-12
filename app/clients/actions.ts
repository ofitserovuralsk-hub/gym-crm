"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

export type ClientFormData = {
  fullName: string;
  phone: string;
  birthDate: string | null;
  photoUrl: string | null;
};

export async function createClient(data: ClientFormData): Promise<{ id: string }> {
  const { data: inserted, error } = await supabase
    .from("clients")
    .insert({
      full_name: data.fullName,
      phone: data.phone,
      birth_date: data.birthDate,
      photo_url: data.photoUrl,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Не удалось добавить клиента: ${error.message}`);
  }

  revalidatePath("/");
  return { id: inserted.id };
}

export async function updateClient(id: string, data: ClientFormData) {
  const { error } = await supabase
    .from("clients")
    .update({
      full_name: data.fullName,
      phone: data.phone,
      birth_date: data.birthDate,
      photo_url: data.photoUrl,
    })
    .eq("id", id);

  if (error) {
    throw new Error(`Не удалось сохранить изменения: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath(`/clients/${id}`);
}
