/**
 * SAFEFRAME 도메인 타입.
 * 좌표/크기는 모두 0~1 정규화 값으로 다룬다. (절대 px 하드코딩 금지)
 */

/** 프레임(9:16 등) 기준 0~1 비율 사각형 */
export type NormalizedRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** 화면 네 방향 Safe Margin (0~1) */
export type SafeZones = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/** block: 플랫폼 UI가 실제로 가리는 영역 / recommend: 콘텐츠 권장 영역 */
export type OverlayKind = "block" | "recommend";

export type OverlayItem = {
  id: string;
  label: string;
  kind: OverlayKind;
  rect: NormalizedRect;
};

export type PlatformPreset = {
  id: string;
  /** 설정/시트에 노출되는 전체 이름 */
  name: string;
  /** 카메라 하단 칩에 노출되는 짧은 이름 */
  shortName: string;
  /** "9:16" 형태 */
  aspectRatio: string;
  /** 안전 영역 마진 */
  zones: SafeZones;
  /** 플랫폼 UI 영역 상세. 없으면 zones 로부터 자동 생성한다. */
  overlays?: OverlayItem[];
  /** 사용자가 직접 마진을 조절할 수 있는 프리셋 여부 */
  editable?: boolean;
  /** 시트에 표기되는 한 줄 설명 */
  description?: string;
};

export type FacingMode = "user" | "environment";

export type GuideId = "none" | "person" | "product" | "food" | "text";

/** Safe Zone 표현 방식 (색상만으로 상태를 구분하지 않기 위한 선택지) */
export type ZoneStyle = "fill" | "hatch" | "outline";

export type UserCameraSettings = {
  platformId: string;
  facingMode: FacingMode;
  gridEnabled: boolean;
  centerLineEnabled: boolean;
  /** Safe Zone 투명도 0.1 ~ 1 */
  overlayOpacity: number;
  includeOverlayInCapture: boolean;
  mirrorFrontCamera: boolean;
  /** 카메라를 지원 가능한 최대 해상도로 요청 */
  highResolution: boolean;
  /** 장면 가이드 (인물/제품/음식/텍스트) */
  guideId: GuideId;
  /** 촬영 필터 */
  filterId: string;
  /** 필터 강도 0~1 */
  filterStrength: number;
  zoneStyle: ZoneStyle;
  labelsEnabled: boolean;
  /** Custom 프리셋에서 사용하는 마진 */
  customZones: SafeZones;
};
