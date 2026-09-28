"use client";

import { RotateCcw, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { PlatformSelector } from "@/components/PlatformSelector";
import { GUIDE_OPTIONS } from "@/lib/guides";
import { PLATFORM_PRESETS } from "@/lib/presets";
import { OPACITY_RANGE, ZONE_RANGE, type settingsActions } from "@/store/cameraStore";
import type { SafeZones, UserCameraSettings, ZoneStyle } from "@/types/camera";

export type SheetSection = "platform" | "guide" | "custom";

type Props = {
  open: boolean;
  onClose: () => void;
  settings: UserCameraSettings;
  actions: typeof settingsActions;
  isCustomPreset: boolean;
  focusSection?: SheetSection;
};

const ZONE_STYLE_OPTIONS: { value: ZoneStyle; label: string }[] = [
  { value: "fill", label: "채움" },
  { value: "hatch", label: "패턴" },
  { value: "outline", label: "외곽선" },
];

const ZONE_SIDES: { key: keyof SafeZones; label: string }[] = [
  { key: "top", label: "상단" },
  { key: "bottom", label: "하단" },
  { key: "left", label: "좌측" },
  { key: "right", label: "우측" },
];

export function SettingsSheet({ open, onClose, settings, actions, isCustomPreset, focusSection }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<SheetSection, HTMLDivElement | null>>({
    platform: null,
    guide: null,
    custom: null,
  });

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    // 첫 섹션(플랫폼)은 이미 보이므로 스크롤하지 않는다.
    if (!open || !focusSection || focusSection === "platform") return;
    const target = sectionRefs.current[focusSection];
    target?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [open, focusSection]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40" role="dialog" aria-modal="true" aria-label="카메라 설정">
      <button
        type="button"
        aria-label="설정 닫기"
        className="sf-fade-in absolute inset-0 h-full w-full bg-black/55"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="sf-sheet-in absolute inset-x-0 bottom-0 max-h-[86%] overflow-y-auto rounded-t-3xl bg-surface outline-none"
      >
        <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur">
          <div className="flex justify-center pt-2.5">
            <span className="h-1 w-10 rounded-full bg-white/25" aria-hidden="true" />
          </div>
          <div className="flex items-center justify-between px-5 pb-3 pt-3">
            <h2 className="text-[17px] font-bold tracking-tight">설정</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="설정 닫기"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 active:bg-white/20"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="space-y-7 px-5 pb-10 pt-1">
          <Section
            title="플랫폼"
            ref={(node) => {
              sectionRefs.current.platform = node;
            }}
          >
            <PlatformSelector
              presets={PLATFORM_PRESETS}
              activeId={settings.platformId}
              onSelect={actions.setPlatform}
              useFullName
            />
            <p className="mt-2 text-[12px] leading-relaxed text-white/50">
              {PLATFORM_PRESETS.find((preset) => preset.id === settings.platformId)?.description}
            </p>
          </Section>

          {isCustomPreset ? (
            <Section
              title="커스텀 안전영역"
              ref={(node) => {
                sectionRefs.current.custom = node;
              }}
              action={
                <button
                  type="button"
                  onClick={actions.resetCustomZones}
                  className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold active:bg-white/20"
                >
                  <RotateCcw size={13} aria-hidden="true" />
                  초기화
                </button>
              }
            >
              <div className="space-y-3">
                {ZONE_SIDES.map((side) => (
                  <label key={side.key} className="flex items-center gap-3">
                    <span className="w-10 shrink-0 text-[13px] font-medium text-white/70">{side.label}</span>
                    <input
                      type="range"
                      className="sf-range flex-1"
                      min={ZONE_RANGE.min}
                      max={ZONE_RANGE.max}
                      step={0.005}
                      value={settings.customZones[side.key]}
                      onChange={(event) => actions.setCustomZone(side.key, Number(event.target.value))}
                      aria-label={side.label + " 안전 마진"}
                      aria-valuetext={Math.round(settings.customZones[side.key] * 100) + "%"}
                    />
                    <span className="w-10 text-right text-[12px] font-semibold tabular-nums text-white/60">
                      {Math.round(settings.customZones[side.key] * 100)}%
                    </span>
                  </label>
                ))}
              </div>
            </Section>
          ) : null}

          <Section
            title="촬영 가이드"
            ref={(node) => {
              sectionRefs.current.guide = node;
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              {GUIDE_OPTIONS.map((option) => {
                const active = settings.guideId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => actions.setGuideId(option.id)}
                    aria-pressed={active}
                    className={
                      "min-h-12 rounded-2xl px-3 py-2.5 text-left transition-colors " +
                      (active ? "bg-white text-black" : "bg-white/10 text-white active:bg-white/20")
                    }
                  >
                    <span className="block text-[14px] font-semibold">{option.name}</span>
                    <span className={"block text-[11px] " + (active ? "text-black/60" : "text-white/45")}>
                      {option.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="표시">
            <label className="mb-4 block">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[14px] font-medium">Safe Zone 투명도</span>
                <span className="text-[12px] font-semibold tabular-nums text-white/60">
                  {Math.round(settings.overlayOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                className="sf-range"
                min={OPACITY_RANGE.min}
                max={OPACITY_RANGE.max}
                step={0.05}
                value={settings.overlayOpacity}
                onChange={(event) => actions.setOverlayOpacity(Number(event.target.value))}
                aria-label="Safe Zone 투명도"
              />
            </label>

            <div className="mb-4">
              <span className="mb-2 block text-[14px] font-medium">Safe Zone 표시 방식</span>
              <div className="flex gap-2" role="radiogroup" aria-label="Safe Zone 표시 방식">
                {ZONE_STYLE_OPTIONS.map((option) => {
                  const active = settings.zoneStyle === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => actions.setZoneStyle(option.value)}
                      className={
                        "h-11 flex-1 rounded-xl text-[13px] font-semibold transition-colors " +
                        (active ? "bg-white text-black" : "bg-white/10 text-white/80 active:bg-white/20")
                      }
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[12px] text-white/45">
                색상 구분이 어려울 때는 패턴 또는 외곽선을 사용하세요.
              </p>
            </div>

            <ToggleRow
              label="영역 이름 표시"
              description="가림 영역에 라벨을 함께 보여줍니다."
              checked={settings.labelsEnabled}
              onChange={actions.setLabelsEnabled}
            />
            <ToggleRow
              label="삼분할선"
              checked={settings.gridEnabled}
              onChange={actions.setGridEnabled}
            />
            <ToggleRow
              label="중앙선"
              checked={settings.centerLineEnabled}
              onChange={actions.setCenterLineEnabled}
            />
          </Section>

          <Section title="촬영">
            <ToggleRow
              label="캡처에 가이드 포함"
              description="저장할 이미지에 안전영역을 함께 그립니다. (결과 화면에서도 바꿀 수 있어요)"
              checked={settings.includeOverlayInCapture}
              onChange={actions.setIncludeOverlayInCapture}
            />
            <ToggleRow
              label="전면 카메라 좌우 반전"
              description="셀카를 거울처럼 보이게 합니다."
              checked={settings.mirrorFrontCamera}
              onChange={actions.setMirrorFrontCamera}
            />
          </Section>

          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-[12px] leading-relaxed text-white/55">
              카메라 영상은 기기 안에서만 처리되며 서버로 전송되지 않습니다. 저장한 사진에는 위치 정보가
              포함되지 않습니다.
            </p>
          </div>

          <button
            type="button"
            onClick={actions.resetAll}
            className="h-12 w-full rounded-2xl bg-white/10 text-[14px] font-semibold text-white/80 active:bg-white/20"
          >
            모든 설정 초기화
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  action,
  ref,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  ref?: (node: HTMLDivElement | null) => void;
}) {
  return (
    <div ref={ref} className="scroll-mt-24">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-white/45">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-b border-white/8 py-3 last:border-b-0">
      <span className="flex-1">
        <span className="block text-[14px] font-medium">{label}</span>
        {description ? <span className="mt-0.5 block text-[11px] leading-snug text-white/45">{description}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={
          "relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors " +
          (checked ? "bg-safe" : "bg-white/20")
        }
      >
        <span
          className="absolute top-[2px] block h-[27px] w-[27px] rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
        />
      </button>
    </div>
  );
}
