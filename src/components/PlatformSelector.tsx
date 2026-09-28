"use client";

import type { PlatformPreset } from "@/types/camera";

type Props = {
  presets: PlatformPreset[];
  activeId: string;
  onSelect: (platformId: string) => void;
  /** 칩에 짧은 이름 대신 전체 이름을 쓸지 여부 (설정 시트용) */
  useFullName?: boolean;
};

/** 하단 가로 스크롤 플랫폼 칩 */
export function PlatformSelector({ presets, activeId, onSelect, useFullName = false }: Props) {
  return (
    <div
      className="sf-scroll-x -mx-1 flex gap-2 px-1"
      role="radiogroup"
      aria-label="플랫폼 프리셋"
    >
      {presets.map((preset) => {
        const active = preset.id === activeId;
        return (
          <button
            key={preset.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(preset.id)}
            className={
              "flex h-11 shrink-0 items-center rounded-full px-4 text-[13px] font-semibold whitespace-nowrap transition-colors " +
              (active
                ? "bg-white text-black"
                : "bg-white/12 text-white/80 hover:bg-white/20 active:bg-white/25")
            }
          >
            {useFullName ? preset.name : preset.shortName}
          </button>
        );
      })}
    </div>
  );
}
