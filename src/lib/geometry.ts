import type { NormalizedRect, SafeZones } from "@/types/camera";

export type Rect = { x: number; y: number; width: number; height: number };
export type Size = { width: number; height: number };

export const EMPTY_RECT: Rect = { x: 0, y: 0, width: 0, height: 0 };

/** "9:16" -> 0.5625 (width / height) */
export function parseAspect(aspectRatio: string): number {
  const [w, h] = aspectRatio.split(":").map((value) => Number.parseFloat(value.trim()));
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return 9 / 16;
  return w / h;
}

/** 컨테이너 안에 aspect 비율 프레임을 중앙 정렬로 최대 크기 배치 (contain) */
export function fitFrame(container: Size, aspect: number): Rect {
  if (container.width <= 0 || container.height <= 0) return EMPTY_RECT;
  let width = container.width;
  let height = width / aspect;
  if (height > container.height) {
    height = container.height;
    width = height * aspect;
  }
  return {
    x: (container.width - width) / 2,
    y: (container.height - height) / 2,
    width,
    height,
  };
}

export type CoverTransform = { scale: number; offsetX: number; offsetY: number };

/**
 * object-fit: cover 로 그려진 영상의 좌표 변환 정보.
 * 프리뷰 해상도와 실제 비디오 해상도가 다르기 때문에 반드시 이 변환을 거친다.
 */
export function coverTransform(container: Size, source: Size): CoverTransform {
  if (source.width <= 0 || source.height <= 0) return { scale: 1, offsetX: 0, offsetY: 0 };
  const scale = Math.max(container.width / source.width, container.height / source.height);
  return {
    scale,
    offsetX: (container.width - source.width * scale) / 2,
    offsetY: (container.height - source.height * scale) / 2,
  };
}

export function clampRect(rect: Rect, bounds: Size): Rect {
  const x = Math.max(0, Math.min(rect.x, bounds.width));
  const y = Math.max(0, Math.min(rect.y, bounds.height));
  return {
    x,
    y,
    width: Math.max(1, Math.min(rect.width, bounds.width - x)),
    height: Math.max(1, Math.min(rect.height, bounds.height - y)),
  };
}

/** 프리뷰(컨테이너) px 사각형 -> 원본 비디오 px 사각형 */
export function containerRectToSource(rect: Rect, container: Size, source: Size): Rect {
  const { scale, offsetX, offsetY } = coverTransform(container, source);
  return clampRect(
    {
      x: (rect.x - offsetX) / scale,
      y: (rect.y - offsetY) / scale,
      width: rect.width / scale,
      height: rect.height / scale,
    },
    source,
  );
}

/** 0~1 사각형을 프레임 px 사각형으로 변환 */
export function denormalize(rect: NormalizedRect, frame: Rect): Rect {
  return {
    x: frame.x + rect.x * frame.width,
    y: frame.y + rect.y * frame.height,
    width: rect.width * frame.width,
    height: rect.height * frame.height,
  };
}

/** 안전 마진을 적용한 콘텐츠 영역 */
export function insetRect(zones: SafeZones): NormalizedRect {
  const left = clamp01(zones.left);
  const right = clamp01(zones.right);
  const top = clamp01(zones.top);
  const bottom = clamp01(zones.bottom);
  return {
    x: left,
    y: top,
    width: Math.max(0.02, 1 - left - right),
    height: Math.max(0.02, 1 - top - bottom),
  };
}

/** overlays 가 없는 프리셋에서 마진을 4개의 가림 영역으로 변환 */
export function zoneBands(zones: SafeZones): { id: string; label: string; rect: NormalizedRect }[] {
  const bands: { id: string; label: string; rect: NormalizedRect }[] = [];
  const top = clamp01(zones.top);
  const bottom = clamp01(zones.bottom);
  const left = clamp01(zones.left);
  const right = clamp01(zones.right);
  if (top > 0) bands.push({ id: "top", label: "상단", rect: { x: 0, y: 0, width: 1, height: top } });
  if (bottom > 0)
    bands.push({ id: "bottom", label: "하단", rect: { x: 0, y: 1 - bottom, width: 1, height: bottom } });
  if (left > 0)
    bands.push({ id: "left", label: "좌측", rect: { x: 0, y: top, width: left, height: 1 - top - bottom } });
  if (right > 0)
    bands.push({
      id: "right",
      label: "우측",
      rect: { x: 1 - right, y: top, width: right, height: 1 - top - bottom },
    });
  return bands;
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/** CSS % 문자열 */
export function pct(value: number): string {
  return `${(value * 100).toFixed(4)}%`;
}
