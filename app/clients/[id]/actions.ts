"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addSubscription(
  clientId: string,
  data: { type: string; startDate: string; endDate: string }
) {
  const supabase = createClient();
  const { error } = await supabase.from("subscriptions").insert({
    client_id: clientId,
    type: data.type,
    start_date: data.startDate,
    end_date: data.endDate,
    status: "active",
  });

  if (error) {
    throw new Error(`Не удалось добавить абонемент: ${error.message}`);
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/");
}

export async function addPayment(
  clientId: string,
  data: {
    amount: number;
    method: string;
    paidAt: string;
    subscriptionId: string | null;
  }
) {
  const supabase = createClient();
  const { error } = await supabase.from("payments").insert({
    client_id: clientId,
    subscription_id: data.subscriptionId,
    amount: data.amount,
    method: data.method,
    paid_at: data.paidAt,
  });

  if (error) {
    throw new Error(`Не удалось добавить оплату: ${error.message}`);
  }

  revalidatePath(`/clients/${clientId}`);
}

export async function addCheckIn(clientId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("check_ins").insert({
    client_id: clientId,
  });

  if (error) {
    throw new Error(`Не удалось отметить приход: ${error.message}`);
  }

  revalidatePath(`/clients/${clientId}`);
}
