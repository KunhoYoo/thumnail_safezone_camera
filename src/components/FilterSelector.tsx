"use client";

import { useEffect, useRef, type RefObject } from "react";

import { FILTERS, getCssFilter, SWATCH_GRADIENT } from "@/lib/filters";

type Props = {
  activeId: string;
  strength: number;
  onSelect: (filterId: string) => void;
  /** 있으면 현재 카메라 화면을 썸네일로 사용한다. */
  videoRef?: RefObject<HTMLVideoElement | null>;
  mirrored?: boolean;
  /** 설정 시트처럼 넓은 곳에서는 격자로 보여준다. */
  variant?: "chips" | "grid";
};

const THUMB_SIZE = 96;
/** 썸네일 갱신 간격 (초당 약 6프레임이면 충분히 부드럽고 가볍다) */
const THUMB_INTERVAL = 160;

/**
 * 필터 선택.
 * 카메라가 켜져 있으면 각 칩이 "지금 보고 있는 장면"에 그 필터를 적용한 모습을 보여준다.
 * (실제 피사체로 비교하는 편이 견본 이미지보다 정확하다)
 */
export function FilterSelector({
  activeId,
  strength,
  onSelect,
  videoRef,
  mirrored = false,
  variant = "chips",
}: Props) {
  const canvasRefs = useRef(new Map<string, HTMLCanvasElement>());

  useEffect(() => {
    if (!videoRef) return;
    let frameId = 0;
    let lastDrawn = 0;

    const draw = (time: number) => {
      frameId = requestAnimationFrame(draw);
      if (time - lastDrawn < THUMB_INTERVAL) return;
      lastDrawn = time;

      const video = videoRef.current;
      if (!video || video.readyState < 2 || !video.videoWidth) return;

      // 중앙 정사각형만 잘라서 그린다.
      const side = Math.min(video.videoWidth, video.videoHeight);
      const sx = (video.videoWidth - side) / 2;
      const sy = (video.videoHeight - side) / 2;

      for (const canvas of canvasRefs.current.values()) {
        const context = canvas.getContext("2d");
        if (!context) continue;
        context.drawImage(video, sx, sy, side, side, 0, 0, canvas.width, canvas.height);
      }
    };

    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [videoRef]);

  const registerCanvas = (filterId: string) => (node: HTMLCanvasElement | null) => {
    if (node) canvasRefs.current.set(filterId, node);
    else canvasRefs.current.delete(filterId);
  };

  const renderThumb = (filterId: string, className: string) => {
    const style = {
      filter: getCssFilter(filterId, strength),
      transform: mirrored ? "scaleX(-1)" : undefined,
    };
    if (videoRef) {
      return (
        <canvas
          ref={registerCanvas(filterId)}
          width={THUMB_SIZE}
          height={THUMB_SIZE}
          className={className + " bg-surface object-cover"}
          style={style}
          aria-hidden="true"
        />
      );
    }
    return (
      <span
        className={className}
        style={{ background: SWATCH_GRADIENT, filter: getCssFilter(filterId, strength) }}
        aria-hidden="true"
      />
    );
  };

  if (variant === "grid") {
    return (
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="필터">
        {FILTERS.map((filter) => {
          const active = filter.id === activeId;
          return (
            <button
              key={filter.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(filter.id)}
              className={
                "flex min-h-12 flex-col items-center gap-1.5 rounded-2xl p-2 transition-colors " +
                (active ? "bg-white text-black" : "bg-white/8 text-white active:bg-white/16")
              }
            >
              {renderThumb(
                filter.id,
                "block h-14 w-full rounded-xl object-cover ring-1 " +
                  (active ? "ring-black/15" : "ring-white/12"),
              )}
              <span className="text-[12px] font-semibold">{filter.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="sf-scroll-x -mx-1 flex gap-2 px-1" role="radiogroup" aria-label="필터">
      {FILTERS.map((filter) => {
        const active = filter.id === activeId;
        return (
          <button
            key={filter.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(filter.id)}
            aria-label={filter.name + " 필터, " + filter.hint}
            className={
              "flex shrink-0 flex-col items-center gap-1 rounded-2xl p-1 transition-colors " +
              (active ? "bg-white" : "bg-transparent")
            }
          >
            <span
              className={
                "block overflow-hidden rounded-xl ring-1 " + (active ? "ring-black/20" : "ring-white/15")
              }
            >
              {renderThumb(filter.id, "block h-12 w-12 object-cover")}
            </span>
            <span
              className={
                "px-1 text-[11px] font-semibold whitespace-nowrap " +
                (active ? "text-black" : "text-white/75")
              }
            >
              {filter.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
