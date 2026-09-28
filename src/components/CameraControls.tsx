"use client";

import { Eye, EyeOff, Grid3x3, Lightbulb, SlidersHorizontal, SwitchCamera, Wand2, X, Zap, ZapOff } from "lucide-react";
import Link from "next/link";
import type { Ref } from "react";

import { CaptureButton } from "@/components/CaptureButton";
import { FilterSelector } from "@/components/FilterSelector";
import { PlatformSelector } from "@/components/PlatformSelector";
import { getFilter } from "@/lib/filters";
import { getGuide, GUIDE_OPTIONS } from "@/lib/guides";
import { OPACITY_RANGE } from "@/store/cameraStore";
import type { GuideId, PlatformPreset } from "@/types/camera";

const ICON_BUTTON =
  "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors active:bg-black/60 disabled:opacity-35";

export type BottomTab = "platform" | "filter" | "scene";

const TABS: { id: BottomTab; label: string }[] = [
  { id: "platform", label: "플랫폼" },
  { id: "filter", label: "필터" },
  { id: "scene", label: "장면" },
];

type TopBarProps = {
  contentRef?: Ref<HTMLDivElement>;
  presetName: string;
  canSwitchCamera: boolean;
  onSwitchCamera: () => void;
  torchSupported: boolean;
  torchOn: boolean;
  onToggleTorch: () => void;
};

export function CameraTopBar({
  contentRef,
  presetName,
  canSwitchCamera,
  onSwitchCamera,
  torchSupported,
  torchOn,
  onToggleTorch,
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
      </div>
    </div>
  );
}

type BottomBarProps = {
  contentRef?: Ref<HTMLDivElement>;
  tab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
  presets: PlatformPreset[];
  activePresetId: string;
  onSelectPreset: (platformId: string) => void;
  overlayVisible: boolean;
  onToggleOverlay: () => void;
  opacity: number;
  onOpacityChange: (value: number) => void;
  filterId: string;
  filterStrength: number;
  onSelectFilter: (filterId: string) => void;
  onFilterStrengthChange: (value: number) => void;
  guideId: GuideId;
  onSelectGuide: (guideId: GuideId) => void;
  gridEnabled: boolean;
  onToggleGrid: () => void;
  onOpenSettings: () => void;
  onCapture: () => void;
  captureDisabled: boolean;
  capturing: boolean;
};

export function CameraBottomBar(props: BottomBarProps) {
  const {
    contentRef,
    tab,
    onTabChange,
    presets,
    activePresetId,
    onSelectPreset,
    overlayVisible,
    onToggleOverlay,
    opacity,
    onOpacityChange,
    filterId,
    filterStrength,
    onSelectFilter,
    onFilterStrengthChange,
    guideId,
    onSelectGuide,
    gridEnabled,
    onToggleGrid,
    onOpenSettings,
    onCapture,
    captureDisabled,
    capturing,
  } = props;

  const filterActive = getFilter(filterId).id !== "none";

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-10">
      <div ref={contentRef} className="pb-safe px-3">
        {/* 1행 — 선택한 탭에 따라 달라지는 보조 컨트롤 (높이는 항상 동일) */}
        <div className="mb-2.5 flex h-11 items-center gap-3">
          {tab === "platform" ? (
            <>
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
                <span className="flex-1 text-[12px] font-medium text-white/55">안전영역 가이드 꺼짐</span>
              )}
            </>
          ) : null}

          {tab === "filter" ? (
            <>
              <span className={ICON_BUTTON + " pointer-events-none"} aria-hidden="true">
                <Wand2 size={19} />
              </span>
              {filterActive ? (
                <label className="flex flex-1 items-center gap-3">
                  <span className="sr-only">필터 강도</span>
                  <input
                    type="range"
                    className="sf-range flex-1"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={filterStrength}
                    onChange={(event) => onFilterStrengthChange(Number(event.target.value))}
                    aria-valuetext={Math.round(filterStrength * 100) + "%"}
                  />
                  <span className="w-10 text-right text-[12px] font-semibold tabular-nums text-white/70">
                    {Math.round(filterStrength * 100)}%
                  </span>
                </label>
              ) : (
                <span className="flex-1 text-[12px] font-medium text-white/55">
                  필터를 고르면 강도를 조절할 수 있어요
                </span>
              )}
            </>
          ) : null}

          {tab === "scene" ? (
            <>
              <span className={ICON_BUTTON + " pointer-events-none"} aria-hidden="true">
                <Lightbulb size={19} />
              </span>
              <span className="flex-1 text-[12px] font-medium leading-snug text-white/70">
                {getGuide(guideId).tip}
              </span>
            </>
          ) : null}
        </div>

        {/* 2행 — 탭 */}
        <div
          className="mb-2.5 flex gap-1 rounded-full bg-black/40 p-1 backdrop-blur-sm"
          role="tablist"
          aria-label="카메라 도구"
        >
          {TABS.map((item) => {
            const active = item.id === tab;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTabChange(item.id)}
                className={
                  "h-8 flex-1 rounded-full text-[12px] font-bold transition-colors " +
                  (active ? "bg-white text-black" : "text-white/65 active:text-white")
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* 3행 — 탭별 선택지 */}
        <div className="mb-2.5">
          {tab === "platform" ? (
            <PlatformSelector presets={presets} activeId={activePresetId} onSelect={onSelectPreset} />
          ) : null}

          {tab === "filter" ? (
            <FilterSelector activeId={filterId} strength={filterStrength} onSelect={onSelectFilter} />
          ) : null}

          {tab === "scene" ? (
            <div className="sf-scroll-x -mx-1 flex gap-2 px-1" role="radiogroup" aria-label="장면">
              {GUIDE_OPTIONS.map((option) => {
                const active = option.id === guideId;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={option.name + ", " + option.hint}
                    onClick={() => onSelectGuide(option.id)}
                    className={
                      "flex h-11 shrink-0 items-center rounded-full px-4 text-[13px] font-semibold whitespace-nowrap transition-colors " +
                      (active ? "bg-white text-black" : "bg-white/12 text-white/80 active:bg-white/25")
                    }
                  >
                    {option.name}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* 4행 — 촬영 */}
        <div className="flex items-center justify-between gap-3">
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

          <CaptureButton onCapture={onCapture} disabled={captureDisabled} busy={capturing} />

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="설정 열기"
            className="grid h-11 w-[74px] place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors active:bg-black/60"
          >
            <SlidersHorizontal size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
