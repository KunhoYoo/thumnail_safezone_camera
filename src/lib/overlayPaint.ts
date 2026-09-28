import type { GuideShape } from "@/lib/guides";
import { denormalize, insetRect, type Rect, zoneBands } from "@/lib/geometry";
import type { PlatformPreset, ZoneStyle } from "@/types/camera";

/** DOM 오버레이와 Canvas 캡처가 같은 색을 쓰도록 한 곳에서 관리한다. */
export const OVERLAY_COLORS = {
  block: "255, 69, 58",
  safe: "48, 209, 88",
  neutral: "255, 255, 255",
} as const;

export type OverlayPaintOptions = {
  /** 캔버스 좌표계에서의 프레임 영역 */
  frame: Rect;
  preset: PlatformPreset;
  opacity: number;
  zoneStyle: ZoneStyle;
  showLabels: boolean;
  grid: boolean;
  centerLine: boolean;
  guides: GuideShape[];
};

type LabeledRect = { id: string; label: string; rect: { x: number; y: number; width: number; height: number } };

const REFERENCE_WIDTH = 390;

export function getBlockRects(preset: PlatformPreset): LabeledRect[] {
  const fromOverlays = preset.overlays?.filter((item) => item.kind === "block");
  if (fromOverlays && fromOverlays.length > 0) {
    return fromOverlays.map((item) => ({ id: item.id, label: item.label, rect: item.rect }));
  }
  return zoneBands(preset.zones);
}

export function getRecommendRects(preset: PlatformPreset): LabeledRect[] {
  const fromOverlays = preset.overlays?.filter((item) => item.kind === "recommend");
  if (fromOverlays && fromOverlays.length > 0) {
    return fromOverlays.map((item) => ({ id: item.id, label: item.label, rect: item.rect }));
  }
  return [{ id: "safe-area", label: "안전 영역", rect: insetRect(preset.zones) }];
}

/**
 * 캡처 이미지에 프리뷰와 동일한 오버레이를 다시 그린다.
 * DOM 오버레이와 같은 0~1 좌표를 사용하므로 해상도가 달라도 결과가 일치한다.
 */
export function paintOverlay(ctx: CanvasRenderingContext2D, options: OverlayPaintOptions): void {
  const { frame, preset, opacity, zoneStyle, showLabels, grid, centerLine, guides } = options;
  if (frame.width <= 0 || frame.height <= 0) return;

  const scale = frame.width / REFERENCE_WIDTH;
  const line = Math.max(1, 1.4 * scale);
  const fontSize = Math.max(9, 10.5 * scale);

  ctx.save();
  ctx.lineJoin = "round";
  ctx.textBaseline = "middle";

  // 1. 플랫폼 UI 가림 영역
  for (const item of getBlockRects(preset)) {
    const rect = denormalize(item.rect, frame);
    drawZone(ctx, rect, zoneStyle, OVERLAY_COLORS.block, opacity, line, scale);
    if (showLabels) {
      drawLabel(ctx, item.label, rect, fontSize, OVERLAY_COLORS.block, opacity);
    }
  }

  // 2. 콘텐츠 권장 영역
  for (const item of getRecommendRects(preset)) {
    const rect = denormalize(item.rect, frame);
    ctx.save();
    ctx.globalAlpha = Math.min(1, opacity + 0.15);
    ctx.strokeStyle = "rgb(" + OVERLAY_COLORS.safe + ")";
    ctx.lineWidth = line;
    ctx.setLineDash([6 * scale, 5 * scale]);
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.restore();
    if (showLabels) {
      drawLabel(ctx, item.label, rect, fontSize, OVERLAY_COLORS.safe, opacity, "bottom");
    }
  }

  // 3. 삼분할선
  if (grid) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, opacity * 0.85);
    ctx.strokeStyle = "rgba(" + OVERLAY_COLORS.neutral + ", 0.65)";
    ctx.lineWidth = Math.max(0.75, line * 0.6);
    for (let i = 1; i <= 2; i += 1) {
      const x = frame.x + (frame.width * i) / 3;
      const y = frame.y + (frame.height * i) / 3;
      strokeLine(ctx, x, frame.y, x, frame.y + frame.height);
      strokeLine(ctx, frame.x, y, frame.x + frame.width, y);
    }
    ctx.restore();
  }

  // 4. 중앙 십자선
  if (centerLine) {
    const cx = frame.x + frame.width / 2;
    const cy = frame.y + frame.height / 2;
    const arm = Math.min(frame.width, frame.height) * 0.05;
    ctx.save();
    ctx.globalAlpha = Math.min(1, opacity + 0.2);
    ctx.strokeStyle = "rgba(" + OVERLAY_COLORS.neutral + ", 0.9)";
    ctx.lineWidth = line;
    strokeLine(ctx, cx - arm, cy, cx + arm, cy);
    strokeLine(ctx, cx, cy - arm, cx, cy + arm);
    ctx.restore();
  }

  // 5. 촬영 가이드
  if (guides.length > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, opacity + 0.2);
    ctx.strokeStyle = "rgba(" + OVERLAY_COLORS.neutral + ", 0.92)";
    ctx.lineWidth = line;
    for (const shape of guides) {
      paintGuide(ctx, shape, frame, scale, showLabels, fontSize);
    }
    ctx.restore();
  }

  ctx.restore();
}

function drawZone(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  zoneStyle: ZoneStyle,
  color: string,
  opacity: number,
  line: number,
  scale: number,
): void {
  ctx.save();
  if (zoneStyle === "fill") {
    ctx.fillStyle = "rgba(" + color + ", " + 0.32 * opacity + ")";
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  } else if (zoneStyle === "hatch") {
    ctx.fillStyle = "rgba(" + color + ", " + 0.14 * opacity + ")";
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.clip();
    ctx.strokeStyle = "rgba(" + color + ", " + 0.7 * opacity + ")";
    ctx.lineWidth = Math.max(1, scale);
    const step = 9 * scale;
    const span = rect.width + rect.height;
    for (let offset = -rect.height; offset < span; offset += step) {
      strokeLine(ctx, rect.x + offset, rect.y + rect.height, rect.x + offset + rect.height, rect.y);
    }
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = Math.min(1, opacity + 0.2);
  ctx.strokeStyle = "rgb(" + color + ")";
  ctx.lineWidth = line;
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  rect: Rect,
  fontSize: number,
  color: string,
  opacity: number,
  position: "top" | "bottom" = "top",
): void {
  if (rect.width < fontSize * 3.2 || rect.height < fontSize * 2) return;
  ctx.save();
  ctx.font = "600 " + fontSize + 'px -apple-system, "Segoe UI", system-ui, sans-serif';
  const padX = fontSize * 0.5;
  const padY = fontSize * 0.34;
  const metrics = ctx.measureText(text);
  const boxWidth = Math.min(rect.width - 4, metrics.width + padX * 2);
  const boxHeight = fontSize + padY * 2;
  const x = rect.x + 3;
  const y = position === "top" ? rect.y + 3 : rect.y + rect.height - boxHeight - 3;
  ctx.globalAlpha = Math.min(1, opacity + 0.3);
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  roundRect(ctx, x, y, boxWidth, boxHeight, boxHeight / 2);
  ctx.fill();
  ctx.fillStyle = "rgb(" + color + ")";
  ctx.textAlign = "left";
  ctx.fillText(text, x + padX, y + boxHeight / 2, boxWidth - padX * 2);
  ctx.restore();
}

function paintGuide(
  ctx: CanvasRenderingContext2D,
  shape: GuideShape,
  frame: Rect,
  scale: number,
  showLabels: boolean,
  fontSize: number,
): void {
  const toX = (value: number) => frame.x + value * frame.width;
  const toY = (value: number) => frame.y + value * frame.height;

  ctx.save();
  switch (shape.kind) {
    case "rect": {
      const rect = denormalize(shape.rect, frame);
      if (shape.dashed) ctx.setLineDash([7 * scale, 5 * scale]);
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      if (showLabels && shape.label) {
        drawLabel(ctx, shape.label, rect, fontSize, OVERLAY_COLORS.neutral, 1);
      }
      break;
    }
    case "ellipse": {
      ctx.setLineDash([7 * scale, 5 * scale]);
      ctx.beginPath();
      ctx.ellipse(
        toX(shape.cx),
        toY(shape.cy),
        shape.rx * frame.width,
        shape.ry * frame.height,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      if (showLabels && shape.label) {
        drawLabel(
          ctx,
          shape.label,
          {
            x: toX(shape.cx - shape.rx),
            y: toY(shape.cy - shape.ry) - fontSize * 2.2,
            width: Math.max(shape.rx * 2 * frame.width, fontSize * 6),
            height: fontSize * 2.2,
          },
          fontSize,
          OVERLAY_COLORS.neutral,
          1,
        );
      }
      break;
    }
    case "hline": {
      ctx.setLineDash([9 * scale, 6 * scale]);
      strokeLine(ctx, frame.x, toY(shape.y), frame.x + frame.width, toY(shape.y));
      if (showLabels && shape.label) {
        drawLabel(
          ctx,
          shape.label,
          {
            x: frame.x + frame.width * 0.02,
            y: toY(shape.y) - fontSize * 2.2,
            width: frame.width * 0.5,
            height: fontSize * 2.2,
          },
          fontSize,
          OVERLAY_COLORS.neutral,
          1,
        );
      }
      break;
    }
    case "vline": {
      ctx.setLineDash([9 * scale, 6 * scale]);
      strokeLine(ctx, toX(shape.x), frame.y, toX(shape.x), frame.y + frame.height);
      break;
    }
    case "line": {
      ctx.setLineDash([9 * scale, 6 * scale]);
      strokeLine(ctx, toX(shape.x1), toY(shape.y1), toX(shape.x2), toY(shape.y2));
      if (showLabels && shape.label) {
        drawLabel(
          ctx,
          shape.label,
          {
            x: toX(Math.min(shape.x1, shape.x2)),
            y: toY(Math.min(shape.y1, shape.y2)),
            width: frame.width * 0.5,
            height: fontSize * 2.2,
          },
          fontSize,
          OVERLAY_COLORS.neutral,
          1,
        );
      }
      break;
    }
  }
  ctx.restore();
}

function strokeLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
