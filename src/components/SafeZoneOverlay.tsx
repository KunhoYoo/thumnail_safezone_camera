"use client";

import { denormalize, type Rect } from "@/lib/geometry";
import { getBlockRects, getRecommendRects, OVERLAY_COLORS } from "@/lib/overlayPaint";
import type { PlatformPreset, ZoneStyle } from "@/types/camera";

type Props = {
  frame: Rect;
  preset: PlatformPreset;
  opacity: number;
  zoneStyle: ZoneStyle;
  showLabels: boolean;
};

/** 최소 크기보다 작은 영역에는 라벨을 그리지 않는다. */
const LABEL_MIN_WIDTH = 84;
const LABEL_MIN_HEIGHT = 26;

/**
 * Safe Zone 은 DOM/CSS 오버레이로 그린다. (캡처 시에는 같은 좌표를 Canvas 로 다시 그린다)
 */
export function SafeZoneOverlay({ frame, preset, opacity, zoneStyle, showLabels }: Props) {
  if (frame.width <= 0 || frame.height <= 0) return null;

  const borderAlpha = Math.min(1, opacity + 0.2);
  const labelAlpha = Math.min(1, opacity + 0.3);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {getBlockRects(preset).map((item) => {
        const rect = denormalize(item.rect, frame);
        const fill =
          zoneStyle === "fill"
            ? "rgba(" + OVERLAY_COLORS.block + ", " + 0.32 * opacity + ")"
            : zoneStyle === "hatch"
              ? "rgba(" + OVERLAY_COLORS.block + ", " + 0.14 * opacity + ")"
              : "transparent";

        return (
          <div
            key={"block-" + item.id}
            className="absolute"
            style={{
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              backgroundColor: fill,
              borderWidth: 1.5,
              borderStyle: "solid",
              borderColor: "rgba(" + OVERLAY_COLORS.block + ", " + borderAlpha + ")",
              willChange: "opacity",
            }}
          >
            {zoneStyle === "hatch" ? (
              <div
                className="sf-hatch absolute inset-0"
                style={{ color: "rgba(" + OVERLAY_COLORS.block + ", " + 0.7 * opacity + ")" }}
              />
            ) : null}
            {showLabels && rect.width >= LABEL_MIN_WIDTH && rect.height >= LABEL_MIN_HEIGHT ? (
              <span
                className="absolute left-1 top-1 max-w-[calc(100%-8px)] truncate rounded-full bg-black/55 px-2 py-[3px] text-[10px] font-semibold tracking-tight"
                style={{ color: "rgb(" + OVERLAY_COLORS.block + ")", opacity: labelAlpha }}
              >
                {item.label}
              </span>
            ) : null}
          </div>
        );
      })}

      {getRecommendRects(preset).map((item) => {
        const rect = denormalize(item.rect, frame);
        return (
          <div
            key={"recommend-" + item.id}
            className="absolute"
            style={{
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              borderWidth: 1.5,
              borderStyle: "dashed",
              borderColor: "rgba(" + OVERLAY_COLORS.safe + ", " + borderAlpha + ")",
            }}
          >
            {showLabels && rect.width >= LABEL_MIN_WIDTH && rect.height >= LABEL_MIN_HEIGHT ? (
              <span
                className="absolute bottom-1 left-1 max-w-[calc(100%-8px)] truncate rounded-full bg-black/55 px-2 py-[3px] text-[10px] font-semibold tracking-tight"
                style={{ color: "rgb(" + OVERLAY_COLORS.safe + ")", opacity: labelAlpha }}
              >
                {item.label}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
