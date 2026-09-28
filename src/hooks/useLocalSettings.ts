"use client";

import { useSyncExternalStore } from "react";
import { useShallow } from "zustand/react/shallow";

import { settingsActions, useCameraStore } from "@/store/cameraStore";
import type { UserCameraSettings } from "@/types/camera";

/**
 * localStorage 에 저장된 최근 설정을 읽고 쓰는 훅.
 * hydrated 가 false 인 동안에는 서버 렌더 결과와 값이 다를 수 있으므로 UI 를 잠시 숨긴다.
 */
export function useLocalSettings(): {
  settings: UserCameraSettings;
  actions: typeof settingsActions;
  hydrated: boolean;
} {
  const settings = useCameraStore(
    useShallow((state) => ({
      platformId: state.platformId,
      facingMode: state.facingMode,
      gridEnabled: state.gridEnabled,
      centerLineEnabled: state.centerLineEnabled,
      overlayOpacity: state.overlayOpacity,
      includeOverlayInCapture: state.includeOverlayInCapture,
      mirrorFrontCamera: state.mirrorFrontCamera,
      highResolution: state.highResolution,
      guideId: state.guideId,
      filterId: state.filterId,
      filterStrength: state.filterStrength,
      zoneStyle: state.zoneStyle,
      labelsEnabled: state.labelsEnabled,
      customZones: state.customZones,
    })),
  );

  // 서버 렌더에서는 항상 false, 클라이언트에서 localStorage 복원이 끝나면 true 가 된다.
  const hydrated = useSyncExternalStore(subscribeHydration, getHydration, getServerHydration);

  return { settings, actions: settingsActions, hydrated };
}

function subscribeHydration(onStoreChange: () => void): () => void {
  return useCameraStore.persist.onFinishHydration(onStoreChange);
}

function getHydration(): boolean {
  return useCameraStore.persist.hasHydrated();
}

function getServerHydration(): boolean {
  return false;
}
