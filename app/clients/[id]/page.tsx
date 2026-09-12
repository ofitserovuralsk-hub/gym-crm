import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { type MembershipStatus } from "@/lib/status";
import ClientHeader from "./client-header";
import SubscriptionsSection from "./subscriptions-section";
import PaymentsSection from "./payments-section";
import CheckInsSection from "./checkins-section";

export const dynamic = "force-dynamic";

type Client = {
  id: string;
  fullName: string;
  phone: string;
  birthDate: string | null;
  photoUrl: string | null;
  membershipStatus: MembershipStatus;
  membershipEndDate: string | null;
};

type Subscription = {
  id: string;
  type: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
};

type Payment = {
  id: string;
  amount: number;
  method: string;
  paidAt: string | null;
};

type CheckIn = {
  id: string;
  checkedInAt: string | null;
};

async function getClient(id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, full_name, phone, birth_date, photo_url, membership_status, membership_end_date"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Не удалось загрузить клиента: ${error.message}`);
  }
  if (!data) return null;

  return {
    id: data.id,
    fullName: data.full_name,
    phone: data.phone,
    birthDate: data.birth_date,
    photoUrl: data.photo_url,
    membershipStatus: data.membership_status as MembershipStatus,
    membershipEndDate: data.membership_end_date,
  };
}

async function getSubscriptions(clientId: string): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, type, start_date, end_date, status")
    .eq("client_id", clientId)
    .order("start_date", { ascending: false });

  if (error) {
    throw new Error(`Не удалось загрузить абонементы: ${error.message}`);
  }

  return data.map((row) => ({
    id: row.id,
    type: row.type,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
  }));
}

async function getPayments(clientId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("id, amount, method, paid_at")
    .eq("client_id", clientId)
    .order("paid_at", { ascending: false });

  if (error) {
    throw new Error(`Не удалось загрузить оплаты: ${error.message}`);
  }

  return data.map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    method: row.method,
    paidAt: row.paid_at,
  }));
}

async function getCheckIns(clientId: string): Promise<CheckIn[]> {
  const { data, error } = await supabase
    .from("check_ins")
    .select("id, checked_in_at")
    .eq("client_id", clientId)
    .order("checked_in_at", { ascending: false });

  if (error) {
    throw new Error(`Не удалось загрузить посещения: ${error.message}`);
  }

  return data.map((row) => ({
    id: row.id,
    checkedInAt: row.checked_in_at,
  }));
}

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const client = await getClient(params.id);
  if (!client) notFound();

  const [subscriptions, payments, checkIns] = await Promise.all([
    getSubscriptions(params.id),
    getPayments(params.id),
    getCheckIns(params.id),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
        ← Все клиенты
      </Link>

      <div className="mt-4">
        <ClientHeader client={client} />
      </div>

      <CheckInsSection clientId={client.id} checkIns={checkIns} />
      <SubscriptionsSection clientId={client.id} subscriptions={subscriptions} />
      <PaymentsSection
        clientId={client.id}
        payments={payments}
        subscriptions={subscriptions}
      />
    </main>
  );
}
