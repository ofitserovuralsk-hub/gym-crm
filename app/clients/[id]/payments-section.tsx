"use client";

import { useState, useTransition } from "react";
import {
  formatDate,
  formatCurrency,
  SUBSCRIPTION_TYPE_LABEL,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_METHOD_LABEL,
} from "@/lib/status";
import { addPayment } from "./actions";

type Payment = {
  id: string;
  amount: number;
  method: string;
  paidAt: string | null;
};

type SubscriptionOption = {
  id: string;
  type: string;
  startDate: string | null;
  endDate: string | null;
};

export default function PaymentsSection({
  clientId,
  payments,
  subscriptions,
}: {
  clientId: string;
  payments: Payment[];
  subscriptions: SubscriptionOption[];
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>(PAYMENT_METHOD_OPTIONS[0].value);
  const [paidAt, setPaidAt] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setAmount("");
    setMethod(PAYMENT_METHOD_OPTIONS[0].value);
    setPaidAt("");
    setSubscriptionId("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountValue = Number(amount);
    if (!amountValue || amountValue <= 0) {
      setError("Укажите сумму больше нуля");
      return;
    }
    if (!paidAt) {
      setError("Укажите дату оплаты");
      return;
    }

    startTransition(async () => {
      try {
        await addPayment(clientId, {
          amount: amountValue,
          method,
          paidAt,
          subscriptionId: subscriptionId || null,
        });
        resetForm();
        setIsFormOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось сохранить");
      }
    });
  }

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Оплаты</h2>
        <button
          type="button"
          onClick={() => setIsFormOpen((open) => !open)}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
        >
          {isFormOpen ? "Отмена" : "Добавить оплату"}
        </button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm text-slate-300">
              Сумма (₸)
              <input
                type="number"
                min={1}
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
              />
            </label>

            <label className="text-sm text-slate-300">
              Способ оплаты
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
              >
                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-slate-300">
              Дата оплаты
              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
              />
            </label>

            <label className="text-sm text-slate-300">
              Абонемент
              <select
                value={subscriptionId}
                onChange={(e) => setSubscriptionId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
              >
                <option value="">Без привязки</option>
                {subscriptions.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {SUBSCRIPTION_TYPE_LABEL[sub.type] ?? sub.type} (
                    {formatDate(sub.startDate)}–{formatDate(sub.endDate)})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {isPending ? "Сохранение…" : "Сохранить"}
          </button>
        </form>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-4 py-2 font-medium">Сумма</th>
              <th className="px-4 py-2 font-medium">Способ</th>
              <th className="px-4 py-2 font-medium">Дата</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-4 text-center text-slate-500">
                  Оплат пока нет
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="border-t border-slate-800">
                  <td className="px-4 py-2">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-2">
                    {PAYMENT_METHOD_LABEL[payment.method] ?? payment.method}
                  </td>
                  <td className="px-4 py-2">{formatDate(payment.paidAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
