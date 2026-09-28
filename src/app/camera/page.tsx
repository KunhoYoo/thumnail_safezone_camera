"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { type BottomTab, CameraBottomBar, CameraTopBar } from "@/components/CameraControls";
import { CameraView } from "@/components/CameraView";
import { CaptureResult } from "@/components/CaptureResult";
import { GuideOverlay } from "@/components/GuideOverlay";
import { PermissionState } from "@/components/PermissionState";
import { SafeZoneOverlay } from "@/components/SafeZoneOverlay";
import { SettingsSheet, type SheetSection } from "@/components/SettingsSheet";
import { useCamera } from "@/hooks/useCamera";
import { useElementSize } from "@/hooks/useElementSize";
import { useLocalSettings } from "@/hooks/useLocalSettings";
import { captureShot, releaseShot, type CaptureShot } from "@/lib/capture";
import { getCssFilter } from "@/lib/filters";
import { containerRectToSource, fitFrame, parseAspect } from "@/lib/geometry";
import { getGuideShapes } from "@/lib/guides";
import { CUSTOM_PLATFORM_ID, PLATFORM_PRESETS, resolvePreset } from "@/lib/presets";
import { buildFileName, canUseWebShare, downloadBlob, isIosLike, shareImage } from "@/lib/share";

export default function CameraPage() {
  const { settings, actions, hydrated } = useLocalSettings();

  const [stageRef, stageSize] = useElementSize<HTMLDivElement>();
  const shotRef = useRef<CaptureShot | null>(null);

  const [overlayVisible, setOverlayVisible] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [tab, setTab] = useState<BottomTab>("platform");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetSection, setSheetSection] = useState<SheetSection>("platform");
  const [shot, setShot] = useState<CaptureShot | null>(null);
  const [resultWithGuide, setResultWithGuide] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const preset = useMemo(
    () => resolvePreset(settings.platformId, settings.customZones),
    [settings.platformId, settings.customZones],
  );
  const aspect = useMemo(() => parseAspect(preset.aspectRatio), [preset.aspectRatio]);

  /**
   * 프레임은 화면을 꽉 채운다. (실제 업로드 화면과 같은 크기로 봐야 의미가 있다)
   * 컨트롤이 하단 안전영역을 가리므로, 화면을 탭하면 컨트롤을 숨길 수 있다.
   */
  const frame = useMemo(() => fitFrame(stageSize, aspect), [stageSize, aspect]);
  const guides = useMemo(() => getGuideShapes(settings.guideId, aspect), [settings.guideId, aspect]);
  const cssFilter = useMemo(
    () => getCssFilter(settings.filterId, settings.filterStrength),
    [settings.filterId, settings.filterStrength],
  );

  // 저장된 설정을 불러오기 전에는 카메라를 시작하지 않는다. (facingMode 가 바뀌며 재시작되는 것을 막는다)
  const camera = useCamera({
    facingMode: settings.facingMode,
    active: hydrated,
    highResolution: settings.highResolution,
  });
  const mirrored = settings.facingMode === "user" && settings.mirrorFrontCamera;
  const cameraReady = camera.status === "ready";

  /** 실제로 저장될 픽셀 크기 (프레임을 원본 해상도로 환산) */
  const captureSize = useMemo(() => {
    const { videoSize } = camera;
    if (!videoSize.width || !videoSize.height || frame.width <= 0) return null;
    const source = containerRectToSource(frame, stageSize, videoSize);
    return { width: Math.round(source.width), height: Math.round(source.height) };
  }, [camera, frame, stageSize]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    return () => {
      releaseShot(shotRef.current);
      shotRef.current = null;
    };
  }, []);

  const handleSelectPreset = useCallback(
    (platformId: string) => {
      actions.setPlatform(platformId);
      setOverlayVisible(true);
      if (platformId === CUSTOM_PLATFORM_ID) {
        setSheetSection("custom");
        setSheetOpen(true);
      }
    },
    [actions],
  );

  // ref 를 직접 읽으므로 수동 메모이제이션 없이 정의한다.
  const handleCapture = async () => {
    const video = camera.videoRef.current;
    if (!video || !cameraReady || capturing) return;

    setCapturing(true);
    setFlash(true);
    navigator.vibrate?.(8);

    try {
      const next = await captureShot({
        video,
        container: stageSize,
        frame,
        preset,
        opacity: settings.overlayOpacity,
        zoneStyle: settings.zoneStyle,
        showLabels: settings.labelsEnabled,
        grid: settings.gridEnabled,
        centerLine: settings.centerLineEnabled,
        guides,
        mirror: mirrored,
        filterId: settings.filterId,
        filterStrength: settings.filterStrength,
      });
      releaseShot(shotRef.current);
      shotRef.current = next;
      setShot(next);
      setResultWithGuide(settings.includeOverlayInCapture && overlayVisible);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "사진을 만들 수 없습니다.");
    } finally {
      setCapturing(false);
      window.setTimeout(() => setFlash(false), 260);
    }
  };

  const activeVariant = shot ? (resultWithGuide ? shot.overlay : shot.clean) : null;

  const handleSave = useCallback(() => {
    if (!shot || !activeVariant) return;
    setBusy(true);
    try {
      downloadBlob(activeVariant.blob, buildFileName(shot.platformId, resultWithGuide));
      setToast(isIosLike() ? "사진 앱 또는 파일에서 확인하세요." : "사진을 저장했습니다.");
    } catch {
      setToast("저장에 실패했습니다. 이미지를 길게 눌러 저장해주세요.");
    } finally {
      setBusy(false);
    }
  }, [activeVariant, resultWithGuide, shot]);

  const handleShare = useCallback(async () => {
    if (!shot || !activeVariant) return;
    setBusy(true);
    const outcome = await shareImage(activeVariant.blob, buildFileName(shot.platformId, resultWithGuide));
    setBusy(false);
    if (outcome === "shared") setToast("공유했습니다.");
    else if (outcome === "downloaded") setToast("공유를 지원하지 않아 저장했습니다.");
    else if (outcome === "failed") setToast("공유에 실패했습니다.");
  }, [activeVariant, resultWithGuide, shot]);

  const handleRetake = useCallback(() => {
    releaseShot(shotRef.current);
    shotRef.current = null;
    setShot(null);
  }, []);

  const shareSupported = hydrated && canUseWebShare(activeVariant?.blob ?? null);

  return (
    <main className="sf-stage flex select-none items-center justify-center">
      <p className="absolute left-1/2 top-3 hidden -translate-x-1/2 text-center text-[12px] text-white/40 md:block">
        데스크톱에서는 세로 프레임 프리뷰로 동작합니다. 실제 촬영은 휴대폰에서 열어주세요.
      </p>

      <div
        ref={stageRef}
        className="relative h-full w-full overflow-hidden bg-black md:h-[min(84vh,800px)] md:w-auto md:aspect-[9/16] md:rounded-[40px] md:ring-1 md:ring-white/12"
      >
        {/* 가이드를 꺼도 어떤 영역이 저장되는지 보이도록 프레임 음영은 유지한다. */}
        <CameraView
          videoRef={camera.videoRef}
          frame={frame}
          mirrored={mirrored}
          shade={cameraReady}
          visible={cameraReady}
          filter={cssFilter}
        >
          {cameraReady && overlayVisible ? (
            <>
              <SafeZoneOverlay
                frame={frame}
                preset={preset}
                opacity={settings.overlayOpacity}
                zoneStyle={settings.zoneStyle}
                showLabels={settings.labelsEnabled}
              />
              <GuideOverlay
                frame={frame}
                aspect={aspect}
                grid={settings.gridEnabled}
                centerLine={settings.centerLineEnabled}
                guides={guides}
                opacity={settings.overlayOpacity}
                showLabels={settings.labelsEnabled}
              />
            </>
          ) : null}
        </CameraView>

        {/* 프리뷰를 탭하면 컨트롤이 숨겨져 하단 안전영역까지 그대로 보인다. */}
        {cameraReady ? (
          <button
            type="button"
            className="absolute inset-0 z-10 cursor-default"
            aria-label={controlsVisible ? "컨트롤 숨기기" : "컨트롤 보이기"}
            onClick={() => setControlsVisible((value) => !value)}
          />
        ) : null}

        {cameraReady && !controlsVisible ? (
          <span className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1.5 text-[11px] font-medium text-white/70 backdrop-blur-sm">
            화면을 탭하면 컨트롤이 다시 나타납니다
          </span>
        ) : null}

        {cameraReady && controlsVisible ? (
          <>
            <CameraTopBar
              presetName={preset.name}
              captureSize={captureSize}
              canSwitchCamera={camera.hasMultipleCameras}
              onSwitchCamera={() =>
                actions.setFacingMode(settings.facingMode === "user" ? "environment" : "user")
              }
              torchSupported={camera.torchSupported && settings.facingMode === "environment"}
              torchOn={camera.torchOn}
              onToggleTorch={() => void camera.toggleTorch()}
            />

            <CameraBottomBar
              tab={tab}
              onTabChange={setTab}
              presets={PLATFORM_PRESETS}
              activePresetId={settings.platformId}
              onSelectPreset={handleSelectPreset}
              overlayVisible={overlayVisible}
              onToggleOverlay={() => setOverlayVisible((value) => !value)}
              opacity={settings.overlayOpacity}
              onOpacityChange={actions.setOverlayOpacity}
              filterId={settings.filterId}
              filterStrength={settings.filterStrength}
              onSelectFilter={actions.setFilterId}
              onFilterStrengthChange={actions.setFilterStrength}
              videoRef={camera.videoRef}
              mirrored={mirrored}
              guideId={settings.guideId}
              onSelectGuide={actions.setGuideId}
              gridEnabled={settings.gridEnabled}
              onToggleGrid={() => actions.setGridEnabled(!settings.gridEnabled)}
              onOpenSettings={() => {
                setSheetSection("platform");
                setSheetOpen(true);
              }}
              onCapture={() => void handleCapture()}
              captureDisabled={!cameraReady}
              capturing={capturing}
            />
          </>
        ) : null}

        <PermissionState
          status={hydrated ? camera.status : "idle"}
          error={camera.error}
          onRetry={camera.retry}
        />

        {flash ? <div className="sf-flash pointer-events-none absolute inset-0 z-40 bg-white" aria-hidden="true" /> : null}

        <SettingsSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          settings={settings}
          actions={actions}
          isCustomPreset={settings.platformId === CUSTOM_PLATFORM_ID}
          focusSection={sheetSection}
        />

        {shot ? (
          <CaptureResult
            shot={shot}
            withGuide={resultWithGuide}
            onToggleGuide={setResultWithGuide}
            onSave={handleSave}
            onShare={() => void handleShare()}
            onRetake={handleRetake}
            shareSupported={shareSupported}
            busy={busy}
          />
        ) : null}

        <div aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-0 z-[60] flex justify-center">
          {toast ? (
            <span className="sf-fade-in mb-28 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-black shadow-lg">
              {toast}
            </span>
          ) : null}
        </div>
      </div>
    </main>
  );
}
