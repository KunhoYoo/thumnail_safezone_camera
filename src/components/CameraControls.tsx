"use client";

import {
  Eye,
  EyeOff,
  Grid3x3,
  SlidersHorizontal,
  SwitchCamera,
  X,
  Zap,
  ZapOff,
} from "lucide-react";
import Link from "next/link";
import type { Ref } from "react";

import { CaptureButton } from "@/components/CaptureButton";
import { PlatformSelector } from "@/components/PlatformSelector";
import { getGuideName } from "@/lib/guides";
import { OPACITY_RANGE } from "@/store/cameraStore";
import type { GuideId, PlatformPreset } from "@/types/camera";

const ICON_BUTTON =
  "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors active:bg-black/60 disabled:opacity-35";

type TopBarProps = {
  /** 프레임 배치 계산을 위해 컨트롤이 실제로 차지하는 높이를 측정한다. */
  contentRef?: Ref<HTMLDivElement>;
  presetName: string;
  canSwitchCamera: boolean;
  onSwitchCamera: () => void;
  torchSupported: boolean;
  torchOn: boolean;
  onToggleTorch: () => void;
  onOpenSettings: () => void;
};

export function CameraTopBar({
  contentRef,
  presetName,
  canSwitchCamera,
  onSwitchCamera,
  torchSupported,
  torchOn,
  onToggleTorch,
  onOpenSettings,
}: TopBarProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/55 to-transparent pb-8">
      <div ref={contentRef} className="pointer-events-auto pt-safe flex items-center gap-2 px-3">
        <Link href="/" aria-label="카메라 닫기" className={ICON_BUTTON}>
          <X size={22} strokeWidth={2} aria-hidden="true" />
        </Link>

        <div className="flex-1 text-center">
          <span className="rounded-full bg-black/40 px-3 py-1.5 text-[12px] font-semibold tracking-tight backdrop-blur-sm">
            {presetName}
          </span>
        </div>

        {torchSupported ? (
          <button
            type="button"
            onClick={onToggleTorch}
            aria-label={torchOn ? "플래시 끄기" : "플래시 켜기"}
            aria-pressed={torchOn}
            className={ICON_BUTTON + (torchOn ? " !bg-white !text-black" : "")}
          >
            {torchOn ? <Zap size={20} aria-hidden="true" /> : <ZapOff size={20} aria-hidden="true" />}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onSwitchCamera}
          disabled={!canSwitchCamera}
          aria-label="전면 / 후면 카메라 전환"
          className={ICON_BUTTON}
        >
          <SwitchCamera size={21} aria-hidden="true" />
        </button>

        <button type="button" onClick={onOpenSettings} aria-label="설정 열기" className={ICON_BUTTON}>
          <SlidersHorizontal size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

type BottomBarProps = {
  contentRef?: Ref<HTMLDivElement>;
  presets: PlatformPreset[];
  activePresetId: string;
  onSelectPreset: (platformId: string) => void;
  overlayVisible: boolean;
  onToggleOverlay: () => void;
  opacity: number;
  onOpacityChange: (value: number) => void;
  gridEnabled: boolean;
  onToggleGrid: () => void;
  guideId: GuideId;
  onOpenGuides: () => void;
  onCapture: () => void;
  captureDisabled: boolean;
  capturing: boolean;
};

export function CameraBottomBar({
  contentRef,
  presets,
  activePresetId,
  onSelectPreset,
  overlayVisible,
  onToggleOverlay,
  opacity,
  onOpacityChange,
  gridEnabled,
  onToggleGrid,
  guideId,
  onOpenGuides,
  onCapture,
  captureDisabled,
  capturing,
}: BottomBarProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/75 via-black/45 to-transparent pt-10">
      <div ref={contentRef} className="pb-safe px-3">
        <div className="mb-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleOverlay}
            aria-pressed={overlayVisible}
            aria-label={overlayVisible ? "안전영역 가이드 숨기기" : "안전영역 가이드 보이기"}
            className={ICON_BUTTON}
          >
            {overlayVisible ? <Eye size={20} aria-hidden="true" /> : <EyeOff size={20} aria-hidden="true" />}
          </button>

          {overlayVisible ? (
            <label className="flex flex-1 items-center gap-3">
              <span className="sr-only">안전영역 투명도</span>
              <input
                type="range"
                className="sf-range flex-1"
                min={OPACITY_RANGE.min}
                max={OPACITY_RANGE.max}
                step={0.05}
                value={opacity}
                onChange={(event) => onOpacityChange(Number(event.target.value))}
                aria-valuetext={Math.round(opacity * 100) + "%"}
              />
              <span className="w-10 text-right text-[12px] font-semibold tabular-nums text-white/70">
                {Math.round(opacity * 100)}%
              </span>
            </label>
          ) : (
            <span className="flex-1 text-[12px] font-medium text-white/60">가이드 꺼짐</span>
          )}
        </div>

        <div className="mb-3">
          <PlatformSelector presets={presets} activeId={activePresetId} onSelect={onSelectPreset} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onOpenGuides}
            className="flex h-11 min-w-[74px] items-center justify-center gap-1.5 rounded-full bg-black/40 px-3 text-[12px] font-semibold text-white backdrop-blur-sm transition-colors active:bg-black/60"
            aria-label={"촬영 가이드 선택, 현재 " + getGuideName(guideId)}
          >
            <span className="text-white/60">가이드</span>
            <span>{getGuideName(guideId)}</span>
          </button>

          <CaptureButton onCapture={onCapture} disabled={captureDisabled} busy={capturing} />

          <button
            type="button"
            onClick={onToggleGrid}
            aria-pressed={gridEnabled}
            aria-label="삼분할선"
            className={
              "grid h-11 w-[74px] place-items-center rounded-full backdrop-blur-sm transition-colors " +
              (gridEnabled ? "bg-white text-black" : "bg-black/40 text-white active:bg-black/60")
            }
          >
            <Grid3x3 size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
