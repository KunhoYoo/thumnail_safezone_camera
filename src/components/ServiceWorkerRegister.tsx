"use client";

import { useEffect } from "react";

/** PWA 서비스 워커 등록 (개발 모드에서는 캐시 혼선을 막기 위해 등록하지 않는다) */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // 오프라인 캐시는 부가 기능이므로 실패해도 앱 사용에는 영향이 없다.
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
