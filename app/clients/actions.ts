"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export type ClientFormData = {
  fullName: string;
  phone: string;
  birthDate: string | null;
  photoUrl: string | null;
};

export async function createClient(
  data: ClientFormData
): Promise<{ id: string }> {
  const supabase = createSupabaseClient();
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
  const supabase = createSupabaseClient();
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

export async function deleteClient(id: string) {
  const currentUser = await getCurrentUser();
  if (currentUser?.role !== "owner") {
    throw new Error("Удаление клиентов доступно только владельцу");
  }

  const supabase = createSupabaseClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    throw new Error(`Не удалось удалить клиента: ${error.message}`);
  }

  revalidatePath("/");
}
