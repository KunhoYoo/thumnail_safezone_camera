import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { DEFAULT_FILTER_ID, getFilter } from "@/lib/filters";
import { clamp, clamp01 } from "@/lib/geometry";
import { getGuide } from "@/lib/guides";
import { DEFAULT_PLATFORM_ID, getPreset } from "@/lib/presets";
import type { FacingMode, GuideId, SafeZones, UserCameraSettings, ZoneStyle } from "@/types/camera";

/** 스펙에 정의된 localStorage 키 */
export const SETTINGS_STORAGE_KEY = "safeframe.camera.settings.v1";

export const DEFAULT_SETTINGS: UserCameraSettings = {
  platformId: DEFAULT_PLATFORM_ID,
  facingMode: "environment",
  gridEnabled: false,
  centerLineEnabled: false,
  overlayOpacity: 0.85,
  includeOverlayInCapture: false,
  mirrorFrontCamera: true,
  highResolution: true,
  guideId: "none",
  filterId: DEFAULT_FILTER_ID,
  filterStrength: 1,
  zoneStyle: "fill",
  labelsEnabled: true,
  customZones: { top: 0.12, bottom: 0.18, left: 0.06, right: 0.12 },
};

export const OPACITY_RANGE = { min: 0.15, max: 1 } as const;
/** 커스텀 마진은 한 방향 최대 40% 까지 */
export const ZONE_RANGE = { min: 0, max: 0.4 } as const;

const GUIDE_IDS: GuideId[] = ["none", "person", "product", "food", "text"];
const ZONE_STYLES: ZoneStyle[] = ["fill", "hatch", "outline"];

export const useCameraStore = create<UserCameraSettings>()(
  persist(() => ({ ...DEFAULT_SETTINGS }), {
    name: SETTINGS_STORAGE_KEY,
    version: 1,
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => state,
    // 저장된 값이 손상되었거나 구버전이어도 앱이 깨지지 않도록 항상 정규화한다.
    merge: (persisted, current) => sanitize(persisted, current),
  }),
);

export const settingsActions = {
  setPlatform(platformId: string) {
    const preset = getPreset(platformId);
    useCameraStore.setState({ platformId: preset.id });
  },
  setFacingMode(facingMode: FacingMode) {
    useCameraStore.setState({ facingMode });
  },
  setGridEnabled(gridEnabled: boolean) {
    useCameraStore.setState({ gridEnabled });
  },
  setCenterLineEnabled(centerLineEnabled: boolean) {
    useCameraStore.setState({ centerLineEnabled });
  },
  setOverlayOpacity(overlayOpacity: number) {
    useCameraStore.setState({ overlayOpacity: clamp(overlayOpacity, OPACITY_RANGE.min, OPACITY_RANGE.max) });
  },
  setIncludeOverlayInCapture(includeOverlayInCapture: boolean) {
    useCameraStore.setState({ includeOverlayInCapture });
  },
  setMirrorFrontCamera(mirrorFrontCamera: boolean) {
    useCameraStore.setState({ mirrorFrontCamera });
  },
  setHighResolution(highResolution: boolean) {
    useCameraStore.setState({ highResolution });
  },
  /** 장면을 고르면 추천 필터가 함께 적용된다. (필터는 이후 개별 변경 가능) */
  setGuideId(guideId: GuideId) {
    useCameraStore.setState({ guideId, filterId: getGuide(guideId).filterId });
  },
  setFilterId(filterId: string) {
    useCameraStore.setState({ filterId: getFilter(filterId).id });
  },
  setFilterStrength(filterStrength: number) {
    useCameraStore.setState({ filterStrength: clamp(filterStrength, 0, 1) });
  },
  setZoneStyle(zoneStyle: ZoneStyle) {
    useCameraStore.setState({ zoneStyle });
  },
  setLabelsEnabled(labelsEnabled: boolean) {
    useCameraStore.setState({ labelsEnabled });
  },
  setCustomZone(side: keyof SafeZones, value: number) {
    const current = useCameraStore.getState().customZones;
    useCameraStore.setState({
      customZones: { ...current, [side]: clamp(value, ZONE_RANGE.min, ZONE_RANGE.max) },
    });
  },
  resetCustomZones() {
    useCameraStore.setState({ customZones: { ...DEFAULT_SETTINGS.customZones } });
  },
  resetAll() {
    useCameraStore.setState({ ...DEFAULT_SETTINGS, customZones: { ...DEFAULT_SETTINGS.customZones } });
  },
};

function sanitize(persisted: unknown, fallback: UserCameraSettings): UserCameraSettings {
  if (!persisted || typeof persisted !== "object") return fallback;
  const raw = persisted as Partial<UserCameraSettings>;
  const zones = raw.customZones;
  return {
    platformId: getPreset(typeof raw.platformId === "string" ? raw.platformId : fallback.platformId).id,
    facingMode: raw.facingMode === "user" || raw.facingMode === "environment" ? raw.facingMode : fallback.facingMode,
    gridEnabled: toBoolean(raw.gridEnabled, fallback.gridEnabled),
    centerLineEnabled: toBoolean(raw.centerLineEnabled, fallback.centerLineEnabled),
    overlayOpacity:
      typeof raw.overlayOpacity === "number"
        ? clamp(raw.overlayOpacity, OPACITY_RANGE.min, OPACITY_RANGE.max)
        : fallback.overlayOpacity,
    includeOverlayInCapture: toBoolean(raw.includeOverlayInCapture, fallback.includeOverlayInCapture),
    mirrorFrontCamera: toBoolean(raw.mirrorFrontCamera, fallback.mirrorFrontCamera),
    highResolution: toBoolean(raw.highResolution, fallback.highResolution),
    guideId: raw.guideId && GUIDE_IDS.includes(raw.guideId) ? raw.guideId : fallback.guideId,
    filterId: typeof raw.filterId === "string" ? getFilter(raw.filterId).id : fallback.filterId,
    filterStrength:
      typeof raw.filterStrength === "number" ? clamp(raw.filterStrength, 0, 1) : fallback.filterStrength,
    zoneStyle: raw.zoneStyle && ZONE_STYLES.includes(raw.zoneStyle) ? raw.zoneStyle : fallback.zoneStyle,
    labelsEnabled: toBoolean(raw.labelsEnabled, fallback.labelsEnabled),
    customZones: zones && typeof zones === "object" ? sanitizeZones(zones, fallback.customZones) : fallback.customZones,
  };
}

function sanitizeZones(zones: Partial<SafeZones>, fallback: SafeZones): SafeZones {
  const pick = (value: unknown, defaultValue: number) =>
    typeof value === "number" && Number.isFinite(value) ? clamp01(value) : defaultValue;
  return {
    top: pick(zones.top, fallback.top),
    bottom: pick(zones.bottom, fallback.bottom),
    left: pick(zones.left, fallback.left),
    right: pick(zones.right, fallback.right),
  };
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}
