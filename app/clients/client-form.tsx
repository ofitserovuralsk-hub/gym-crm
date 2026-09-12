"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createClient, updateClient, type ClientFormData } from "./actions";
import CameraCapture from "./camera-capture";

type ClientFormProps = {
  mode: "create" | "edit";
  clientId?: string;
  initialValues?: {
    fullName: string;
    phone: string;
    birthDate: string | null;
    photoUrl: string | null;
  };
  onSaved?: () => void;
};

async function uploadPhoto(blob: Blob): Promise<string> {
  const path = `${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from("client-photos")
    .upload(path, blob, { contentType: "image/jpeg" });

  if (error) {
    throw new Error(`Не удалось загрузить фото: ${error.message}`);
  }

  const { data } = supabase.storage.from("client-photos").getPublicUrl(path);
  return data.publicUrl;
}

export default function ClientForm({
  mode,
  clientId,
  initialValues,
  onSaved,
}: ClientFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialValues?.fullName ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [birthDate, setBirthDate] = useState(initialValues?.birthDate ?? "");
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      setError("Укажите ФИО и телефон");
      return;
    }

    startTransition(async () => {
      try {
        const photoUrl = photoBlob
          ? await uploadPhoto(photoBlob)
          : initialValues?.photoUrl ?? null;

        const data: ClientFormData = {
          fullName: fullName.trim(),
          phone: phone.trim(),
          birthDate: birthDate || null,
          photoUrl,
        };

        if (mode === "create") {
          const { id } = await createClient(data);
          router.push(`/clients/${id}`);
        } else if (clientId) {
          await updateClient(clientId, data);
          onSaved?.();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось сохранить");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-800 bg-slate-900 p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-300">
          ФИО
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
          />
        </label>

        <label className="text-sm text-slate-300">
          Телефон
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
          />
        </label>

        <label className="text-sm text-slate-300">
          Дата рождения
          <input
            type="date"
            value={birthDate ?? ""}
            onChange={(e) => setBirthDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
          />
        </label>
      </div>

      <div className="mt-3">
        <CameraCapture
          initialPhotoUrl={initialValues?.photoUrl ?? null}
          onCapture={setPhotoBlob}
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {isPending ? "Сохранение…" : "Сохранить"}
        </button>
        {mode === "edit" && (
          <button
            type="button"
            onClick={() => onSaved?.()}
            className="rounded-lg border border-slate-700 px-4 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}
