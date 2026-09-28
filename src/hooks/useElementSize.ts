"use client";

import { useCallback, useState } from "react";

import type { Size } from "@/lib/geometry";

/**
 * 요소 크기를 추적한다. (화면 회전 / 주소창 높이 변화 / 뒤늦게 마운트되는 컨트롤 대응)
 * ref 콜백 방식이라 요소가 나중에 나타나도 정확히 측정된다.
 */
export function useElementSize<T extends HTMLElement = HTMLElement>(): [
  (node: T | null) => void | (() => void),
  Size,
] {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  const ref = useCallback((node: T | null) => {
    if (!node) return;

    const measure = () => {
      const rect = node.getBoundingClientRect();
      setSize((previous) =>
        Math.abs(previous.width - rect.width) < 0.5 && Math.abs(previous.height - rect.height) < 0.5
          ? previous
          : { width: rect.width, height: rect.height },
      );
    };

    measure();
    window.addEventListener("orientationchange", measure);

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => {
        window.removeEventListener("resize", measure);
        window.removeEventListener("orientationchange", measure);
      };
    }

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", measure);
    };
  }, []);

  return [ref, size];
}
