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
import { fitFrame, parseAspect } from "@/lib/geometry";
import { getGuideShapes } from "@/lib/guides";
import { CUSTOM_PLATFORM_ID, PLATFORM_PRESETS, resolvePreset } from "@/lib/presets";
import { buildFileName, canUseWebShare, downloadBlob, isIosLike, shareImage } from "@/lib/share";

/** 프레임과 컨트롤 사이 여백 */
const CONTROL_GAP = 8;
/** 컨트롤을 제외한 높이가 이보다 작으면 화면 전체에 맞춘다. (가로 모드 등) */
const MIN_FRAME_HEIGHT = 220;

export default function CameraPage() {
  const { settings, actions, hydrated } = useLocalSettings();

  const [stageRef, stageSize] = useElementSize<HTMLDivElement>();
  const [topBarRef, topBarSize] = useElementSize<HTMLDivElement>();
  const [bottomBarRef, bottomBarSize] = useElementSize<HTMLDivElement>();
  const shotRef = useRef<CaptureShot | null>(null);

  const [overlayVisible, setOverlayVisible] = useState(true);
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
   * 상·하단 컨트롤이 안전영역을 가리지 않도록, 컨트롤 사이의 빈 공간에 프레임을 맞춘다.
   * 영상 자체는 화면 전체를 cover 로 채우고 프레임 바깥은 어둡게 처리한다.
   */
  const frame = useMemo(() => {
    const gap = CONTROL_GAP;
    const available = stageSize.height - topBarSize.height - bottomBarSize.height - gap * 2;
    if (available < MIN_FRAME_HEIGHT) return fitFrame(stageSize, aspect);
    const fitted = fitFrame({ width: stageSize.width, height: available }, aspect);
    return { ...fitted, y: fitted.y + topBarSize.height + gap };
  }, [stageSize, topBarSize.height, bottomBarSize.height, aspect]);
  const guides = useMemo(() => getGuideShapes(settings.guideId, aspect), [settings.guideId, aspect]);
  const cssFilter = useMemo(
    () => getCssFilter(settings.filterId, settings.filterStrength),
    [settings.filterId, settings.filterStrength],
  );

  // 저장된 설정을 불러오기 전에는 카메라를 시작하지 않는다. (facingMode 가 바뀌며 재시작되는 것을 막는다)
  const camera = useCamera({ facingMode: settings.facingMode, active: hydrated });
  const mirrored = settings.facingMode === "user" && settings.mirrorFrontCamera;
  const cameraReady = camera.status === "ready";

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

        {cameraReady ? (
          <>
            <CameraTopBar
              contentRef={topBarRef}
              presetName={preset.name}
              canSwitchCamera={camera.hasMultipleCameras}
              onSwitchCamera={() =>
                actions.setFacingMode(settings.facingMode === "user" ? "environment" : "user")
              }
              torchSupported={camera.torchSupported && settings.facingMode === "environment"}
              torchOn={camera.torchOn}
              onToggleTorch={() => void camera.toggleTorch()}
            />

            <CameraBottomBar
              contentRef={bottomBarRef}
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
