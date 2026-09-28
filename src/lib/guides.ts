import type { GuideId, NormalizedRect } from "@/types/camera";

/**
 * 촬영 가이드는 이미지 분석 없이 단순 Overlay 로만 구현한다.
 * 모든 좌표는 프레임 기준 0~1 비율.
 */
export type GuideShape =
  | { kind: "rect"; rect: NormalizedRect; label?: string; dashed?: boolean }
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number; label?: string }
  | { kind: "hline"; y: number; label?: string }
  | { kind: "vline"; x: number; label?: string }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number; label?: string };

export const GUIDE_OPTIONS: { id: GuideId; name: string; hint: string }[] = [
  { id: "none", name: "없음", hint: "가이드 없이 촬영" },
  { id: "person", name: "인물", hint: "얼굴 위치 · 눈높이 · 헤드룸" },
  { id: "product", name: "제품", hint: "중앙 배치 · 4:5 / 1:1 크롭" },
  { id: "food", name: "음식", hint: "접시 중심 · 45도 구도" },
  { id: "text", name: "텍스트", hint: "제목 · 하단 CTA 안전 영역" },
];

export function getGuideName(id: GuideId): string {
  return GUIDE_OPTIONS.find((option) => option.id === id)?.name ?? "없음";
}

/**
 * 프레임 전체 폭(k 비율)을 채우는 crop 미리보기 사각형.
 * ch/H = k * frameAspect / cropAspect
 */
function centeredCrop(cropAspect: number, frameAspect: number, k = 0.92): NormalizedRect {
  const width = k;
  const height = Math.min(0.96, (k * frameAspect) / cropAspect);
  return { x: (1 - width) / 2, y: (1 - height) / 2, width, height };
}

export function getGuideShapes(id: GuideId, frameAspect: number): GuideShape[] {
  switch (id) {
    case "person":
      return [
        { kind: "ellipse", cx: 0.5, cy: 0.33, rx: 0.16, ry: 0.115, label: "얼굴 권장" },
        { kind: "hline", y: 0.3, label: "눈높이" },
        { kind: "hline", y: 0.14, label: "헤드룸" },
        { kind: "rect", rect: { x: 0.2, y: 0.2, width: 0.6, height: 0.62 }, dashed: true, label: "상반신" },
      ];
    case "product":
      return [
        { kind: "rect", rect: centeredCrop(4 / 5, frameAspect), dashed: true, label: "4:5 크롭" },
        { kind: "rect", rect: centeredCrop(1, frameAspect), dashed: true, label: "1:1 크롭" },
        {
          kind: "rect",
          rect: { x: 0.26, y: 0.34, width: 0.48, height: 0.3 },
          label: "제품 중앙 영역",
        },
      ];
    case "food":
      return [
        { kind: "ellipse", cx: 0.5, cy: 0.5, rx: 0.3, ry: 0.17, label: "접시 중심" },
        { kind: "line", x1: 0.12, y1: 0.76, x2: 0.88, y2: 0.3, label: "45도 구도" },
        { kind: "hline", y: 0.5 },
      ];
    case "text":
      return [
        { kind: "rect", rect: { x: 0.1, y: 0.16, width: 0.68, height: 0.14 }, label: "제목 안전 영역" },
        { kind: "rect", rect: { x: 0.1, y: 0.6, width: 0.62, height: 0.12 }, label: "하단 CTA 안전 영역" },
      ];
    case "none":
    default:
      return [];
  }
}
