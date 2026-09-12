import Link from "next/link";
import ClientForm from "../client-form";

export default function NewClientPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
        ← Все клиенты
      </Link>
      <h1 className="mt-4 text-xl font-semibold">Новый клиент</h1>
      <div className="mt-4">
        <ClientForm mode="create" />
      </div>
    </main>
  );
}
