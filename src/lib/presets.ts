import type { PlatformPreset, SafeZones } from "@/types/camera";

/**
 * 플랫폼 UI 는 언제든 변경될 수 있으므로 값은 이 파일의 상수 구조에서만 관리한다.
 * (컴포넌트 안에 하드코딩하지 않는다. 원격 업데이트가 필요해지면 이 배열만 교체하면 된다.)
 *
 * 모든 값은 9:16 프레임 기준 0~1 비율이다.
 */
export const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    id: "youtube-shorts",
    name: "YouTube Shorts",
    shortName: "Shorts",
    aspectRatio: "9:16",
    description: "상단 제목, 우측 액션, 하단 채널·음원 영역",
    zones: { top: 0.08, bottom: 0.2, left: 0.04, right: 0.16 },
    overlays: [
      { id: "top", label: "상단 제목 · 상태", kind: "block", rect: { x: 0, y: 0, width: 1, height: 0.08 } },
      {
        id: "actions",
        label: "좋아요 · 댓글 · 공유",
        kind: "block",
        rect: { x: 0.84, y: 0.4, width: 0.16, height: 0.42 },
      },
      {
        id: "bottom",
        label: "채널 · 제목 · 음원",
        kind: "block",
        rect: { x: 0, y: 0.8, width: 0.84, height: 0.2 },
      },
      {
        id: "content",
        label: "콘텐츠 권장 영역",
        kind: "recommend",
        rect: { x: 0.06, y: 0.14, width: 0.76, height: 0.62 },
      },
    ],
  },
  {
    id: "instagram-reels",
    name: "Instagram Reels",
    shortName: "Reels",
    aspectRatio: "9:16",
    description: "상단 앱 UI, 우측 액션, 하단 계정·캡션 영역",
    zones: { top: 0.09, bottom: 0.22, left: 0.05, right: 0.17 },
    overlays: [
      { id: "top", label: "상단 앱 UI", kind: "block", rect: { x: 0, y: 0, width: 1, height: 0.09 } },
      {
        id: "actions",
        label: "액션 버튼",
        kind: "block",
        rect: { x: 0.83, y: 0.38, width: 0.17, height: 0.44 },
      },
      {
        id: "bottom",
        label: "계정 · 캡션 · 음원",
        kind: "block",
        rect: { x: 0, y: 0.78, width: 0.83, height: 0.22 },
      },
      {
        id: "text",
        label: "텍스트 권장 영역",
        kind: "recommend",
        rect: { x: 0.07, y: 0.16, width: 0.74, height: 0.58 },
      },
    ],
  },
  {
    id: "tiktok",
    name: "TikTok",
    shortName: "TikTok",
    aspectRatio: "9:16",
    description: "상단 탭, 우측 액션, 하단 캡션·음원 영역",
    zones: { top: 0.1, bottom: 0.24, left: 0.05, right: 0.18 },
    overlays: [
      { id: "top", label: "상단 탭 · 검색", kind: "block", rect: { x: 0, y: 0, width: 1, height: 0.1 } },
      {
        id: "actions",
        label: "액션 영역",
        kind: "block",
        rect: { x: 0.82, y: 0.36, width: 0.18, height: 0.46 },
      },
      {
        id: "bottom",
        label: "캡션 · 음원",
        kind: "block",
        rect: { x: 0, y: 0.76, width: 0.82, height: 0.24 },
      },
      {
        id: "content",
        label: "콘텐츠 권장 영역",
        kind: "recommend",
        rect: { x: 0.07, y: 0.17, width: 0.73, height: 0.56 },
      },
    ],
  },
  {
    id: "vertical-9-16",
    name: "일반 세로 영상",
    shortName: "9:16",
    aspectRatio: "9:16",
    description: "상·하 10%, 좌·우 6% 기본 안전 영역",
    zones: { top: 0.1, bottom: 0.1, left: 0.06, right: 0.06 },
  },
  {
    id: "custom",
    name: "커스텀",
    shortName: "Custom",
    aspectRatio: "9:16",
    description: "상·하·좌·우 마진을 직접 조절",
    editable: true,
    zones: { top: 0.12, bottom: 0.18, left: 0.06, right: 0.12 },
  },
];

export const DEFAULT_PLATFORM_ID = "youtube-shorts";

export const CUSTOM_PLATFORM_ID = "custom";

export function getPreset(platformId: string): PlatformPreset {
  return (
    PLATFORM_PRESETS.find((preset) => preset.id === platformId) ??
    PLATFORM_PRESETS.find((preset) => preset.id === DEFAULT_PLATFORM_ID) ??
    PLATFORM_PRESETS[0]
  );
}

/** editable 프리셋에는 사용자가 저장한 마진을 적용해서 돌려준다. */
export function resolvePreset(platformId: string, customZones: SafeZones): PlatformPreset {
  const preset = getPreset(platformId);
  if (!preset.editable) return preset;
  return { ...preset, zones: customZones };
}
