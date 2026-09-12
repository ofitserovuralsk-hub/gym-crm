"use client";

import { useEffect, useRef, useState } from "react";

export default function CameraCapture({
  initialPhotoUrl,
  onCapture,
}: {
  initialPhotoUrl: string | null;
  onCapture: (blob: Blob | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // <video> монтируется только когда isCameraOn === true, поэтому в момент
  // получения потока (внутри startCamera) videoRef.current ещё null — React
  // не успевает отрендерить элемент до следующего эффекта. Привязываем поток
  // здесь, после того как видео гарантированно уже в DOM.
  useEffect(() => {
    if (isCameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOn]);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      setIsCameraOn(true);
    } catch (err) {
      setError(
        "Не удалось получить доступ к камере. Проверьте разрешения браузера."
      );
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraOn(false);
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(blob));
        onCapture(blob);
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  }

  function retake() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onCapture(null);
    startCamera();
  }

  const displayUrl = previewUrl ?? initialPhotoUrl;

  return (
    <div>
      <p className="text-sm text-slate-300">Фото</p>

      <div className="mt-1 flex items-start gap-3">
        {isCameraOn ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-32 w-32 rounded-lg border border-slate-700 object-cover"
          />
        ) : displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt="Фото клиента"
            className="h-32 w-32 rounded-lg border border-slate-700 object-cover"
          />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-dashed border-slate-700 text-xs text-slate-500">
            Нет фото
          </div>
        )}

        <div className="flex flex-col gap-2">
          {isCameraOn ? (
            <>
              <button
                type="button"
                onClick={capture}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Сделать снимок
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Отмена
              </button>
            </>
          ) : previewUrl ? (
            <button
              type="button"
              onClick={retake}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Переснять
            </button>
          ) : (
            <button
              type="button"
              onClick={startCamera}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Включить камеру
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
