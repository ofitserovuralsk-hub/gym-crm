"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // В dev-режиме код меняется постоянно, а cache-first стратегия SW будет
    // отдавать устаревший HTML/JS и вызывать рассинхрон с новым бандлом
    // (ошибки гидратации). Регистрируем только в проде.
    if (process.env.NODE_ENV !== "production") return;

    function register() {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((reg) => {
          console.log("Service worker registered:", reg.scope);
        })
        .catch((err) => {
          console.error("Service worker registration failed:", err);
        });
    }

    // К моменту, когда сработает этот эффект (после гидратации), событие
    // "load" почти всегда уже произошло — слушатель на него никогда не
    // сработает. Регистрируем сразу, либо ждём "load", если он ещё не был.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
