"use client";

import { Download, RotateCcw, Share2, X } from "lucide-react";

import type { CaptureShot } from "@/lib/capture";
import { getCssFilter, getFilter, SWATCH_GRADIENT } from "@/lib/filters";

type Props = {
  shot: CaptureShot;
  withGuide: boolean;
  onToggleGuide: (value: boolean) => void;
  onSave: () => void;
  onShare: () => void;
  onRetake: () => void;
  shareSupported: boolean;
  busy: boolean;
};

/** 촬영 결과 풀스크린 미리보기 */
export function CaptureResult({
  shot,
  withGuide,
  onToggleGuide,
  onSave,
  onShare,
  onRetake,
  shareSupported,
  busy,
}: Props) {
  const source = withGuide ? shot.overlay.url : shot.clean.url;

  return (
    <div className="sf-fade-in absolute inset-0 z-50 flex flex-col bg-ink">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/60 to-transparent pb-10">
        <div className="pointer-events-auto pt-safe flex items-center justify-between px-3">
          <button
            type="button"
            onClick={onRetake}
            aria-label="미리보기 닫고 다시 촬영"
            className="grid h-11 w-11 place-items-center rounded-full bg-black/45 backdrop-blur-sm active:bg-black/65"
          >
            <X size={22} aria-hidden="true" />
          </button>
          <div className="flex items-center gap-1.5">
            {shot.filterId !== "none" ? (
              <span className="flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1.5 text-[12px] font-semibold backdrop-blur-sm">
                <span
                  className="block h-3.5 w-3.5 rounded-full ring-1 ring-white/25"
                  style={{ background: SWATCH_GRADIENT, filter: getCssFilter(shot.filterId, 1) }}
                  aria-hidden="true"
                />
                {getFilter(shot.filterId).name}
              </span>
            ) : null}
            <span className="rounded-full bg-black/45 px-3 py-1.5 text-[12px] font-semibold tabular-nums backdrop-blur-sm">
              {shot.width} × {shot.height}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden p-2">
        {/* 캡처 결과는 이미 잘린 이미지이므로 next/image 최적화 없이 그대로 표시한다. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={source}
          alt="촬영한 사진 미리보기"
          className="max-h-full max-w-full object-contain"
          width={shot.width}
          height={shot.height}
        />
      </div>

      <div className="pb-safe px-4 pt-3">
        <div className="mx-auto mb-3 flex max-w-[420px] gap-1 rounded-full bg-white/10 p-1" role="radiogroup" aria-label="가이드 표시">
          <button
            type="button"
            role="radio"
            aria-checked={!withGuide}
            onClick={() => onToggleGuide(false)}
            className={
              "h-10 flex-1 rounded-full text-[13px] font-semibold transition-colors " +
              (!withGuide ? "bg-white text-black" : "text-white/70")
            }
          >
            가이드 제거
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={withGuide}
            onClick={() => onToggleGuide(true)}
            className={
              "h-10 flex-1 rounded-full text-[13px] font-semibold transition-colors " +
              (withGuide ? "bg-white text-black" : "text-white/70")
            }
          >
            가이드 포함
          </button>
        </div>

        <div className="mx-auto flex max-w-[420px] gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={busy}
            className="flex h-13 min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white/12 text-[15px] font-bold text-white active:bg-white/20 disabled:opacity-50"
          >
            <Download size={18} aria-hidden="true" />
            저장
          </button>
          {shareSupported ? (
            <button
              type="button"
              onClick={onShare}
              disabled={busy}
              className="flex h-13 min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-white text-[15px] font-bold text-black active:bg-white/85 disabled:opacity-50"
            >
              <Share2 size={18} aria-hidden="true" />
              공유
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onRetake}
          className="mx-auto mt-2 flex h-12 w-full max-w-[420px] items-center justify-center gap-2 rounded-2xl text-[14px] font-semibold text-white/65 active:text-white"
        >
          <RotateCcw size={16} aria-hidden="true" />
          다시 촬영
        </button>
      </div>
    </div>
  );
}
