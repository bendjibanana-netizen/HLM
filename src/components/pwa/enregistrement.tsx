"use client";

import { useEffect } from "react";

/** Enregistre le service worker (lecture hors-ligne, notifications push). Sans effet si le navigateur ne le gère pas. */
export function EnregistrementServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((erreur) => console.warn("Service worker non enregistré :", erreur));
  }, []);
  return null;
}
