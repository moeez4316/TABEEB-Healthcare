// src/components/RegisterSW.tsx
"use client";
import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const isDevelopment = process.env.NODE_ENV === "development";

    if (isDevelopment) {
      // In development, stale SW caches can cause ChunkLoadError after code changes.
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(async () => {
          if (typeof caches === "undefined") return;
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map((key) => caches.delete(key)));
        })
        .catch((error) => console.error("Failed to cleanup service workers in development:", error));
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("SW registered:", reg))
      .catch((err) => console.error("SW registration failed:", err));
  }, []);
  return null;
}
