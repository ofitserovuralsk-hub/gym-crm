"use client";

import { useEffect, useState } from "react";

// Событие Chrome/Edge/Android: браузер сам предлагает установку, но только
// если вызвать prompt() из клика пользователя — поэтому нужна кнопка.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "install-prompt-dismissed-at";
const DISMISS_DAYS = 14;

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// iOS Safari не умеет программную установку — только "Поделиться → На экран Домой".
// iPadOS 13+ выдаёт себя за Mac, поэтому дополнительно смотрим на touch.
function isIos(): boolean {
  const ua = navigator.userAgent;
  return (
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  );
}

function wasRecentlyDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return !!at && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function InstallButton() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return;

    setIos(isIos());
    setHidden(false);

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setHidden(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage может быть недоступен (приватный режим) — не страшно.
    }
  }

  async function handleInstall() {
    if (installEvent) {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      setInstallEvent(null);
      if (outcome === "accepted") setHidden(true);
      else dismiss();
      return;
    }
    setShowIosHint((v) => !v);
  }

  // Показываем кнопку только там, где установка возможна: Chrome/Android
  // (после beforeinstallprompt) или iOS (по инструкции).
  if (hidden || (!installEvent && !ios)) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-100">
              Установить приложение
            </p>
            <p className="text-xs text-slate-400">
              Ярлык на главном экране, быстрый вход
            </p>
          </div>
          <button
            type="button"
            onClick={handleInstall}
            className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Установить
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Скрыть"
            className="shrink-0 px-1 text-lg leading-none text-slate-500 hover:text-slate-300"
          >
            ×
          </button>
        </div>

        {showIosHint && !installEvent && (
          <p className="mt-3 border-t border-slate-800 pt-3 text-xs text-slate-300">
            В Safari нажмите кнопку «Поделиться» (квадрат со стрелкой внизу
            экрана), затем «На экран «Домой»» и «Добавить».
          </p>
        )}
      </div>
    </div>
  );
}
