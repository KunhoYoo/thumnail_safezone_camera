"use client";

import { FILTERS, getCssFilter, SWATCH_GRADIENT } from "@/lib/filters";

type Props = {
  activeId: string;
  strength: number;
  onSelect: (filterId: string) => void;
  /** 설정 시트처럼 넓은 곳에서는 이름과 설명을 함께 보여준다. */
  variant?: "chips" | "grid";
};

/**
 * 필터 선택.
 * 각 칩의 썸네일은 동일한 기준 그라데이션에 해당 필터를 실제로 적용한 것이라,
 * 카메라를 켜지 않아도 색 변화를 바로 확인할 수 있다.
 */
export function FilterSelector({ activeId, strength, onSelect, variant = "chips" }: Props) {
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
              <span
                className={
                  "block h-12 w-full rounded-xl ring-1 " + (active ? "ring-black/15" : "ring-white/12")
                }
                style={{
                  background: SWATCH_GRADIENT,
                  filter: getCssFilter(filter.id, strength),
                }}
                aria-hidden="true"
              />
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
            className="flex h-11 shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors"
            style={{
              backgroundColor: active ? "#fff" : "rgba(255,255,255,0.12)",
              color: active ? "#000" : "rgba(255,255,255,0.85)",
            }}
          >
            <span
              className="block h-9 w-9 shrink-0 rounded-full ring-1 ring-black/15"
              style={{ background: SWATCH_GRADIENT, filter: getCssFilter(filter.id, strength) }}
              aria-hidden="true"
            />
            <span className="text-[13px] font-semibold whitespace-nowrap">{filter.name}</span>
          </button>
        );
      })}
    </div>
  );
}
