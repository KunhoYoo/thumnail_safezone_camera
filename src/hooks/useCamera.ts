"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Size } from "@/lib/geometry";
import type { FacingMode } from "@/types/camera";

export type CameraStatus = "idle" | "requesting" | "ready" | "error";

export type CameraErrorCode = "insecure" | "unsupported" | "denied" | "notFound" | "inUse" | "unknown";

export type CameraError = {
  code: CameraErrorCode;
  title: string;
  message: string;
  hint?: string;
};

/** 개발자용 에러 메시지를 그대로 노출하지 않고, 상황별 안내 문구로 변환한다. */
const ERROR_COPY: Record<CameraErrorCode, CameraError> = {
  insecure: {
    code: "insecure",
    title: "보안 연결이 필요합니다",
    message: "카메라는 보안 연결(HTTPS)에서만 사용할 수 있습니다.",
    hint: "주소가 https 로 시작하는지 확인해주세요.",
  },
  unsupported: {
    code: "unsupported",
    title: "이 브라우저에서는 카메라를 쓸 수 없습니다",
    message: "카메라 기능을 지원하지 않는 브라우저입니다.",
    hint: "iPhone 은 Safari, Android 는 Chrome 최신 버전을 사용해주세요.",
  },
  denied: {
    code: "denied",
    title: "카메라 권한이 필요합니다",
    message: "브라우저 설정에서 카메라 권한을 허용한 뒤 다시 시도해주세요.",
    hint: "주소창 왼쪽 자물쇠 아이콘 → 카메라 → 허용",
  },
  notFound: {
    code: "notFound",
    title: "카메라를 찾을 수 없습니다",
    message: "이 기기에서 사용할 수 있는 카메라가 없습니다.",
    hint: "휴대폰에서 열면 바로 촬영할 수 있습니다.",
  },
  inUse: {
    code: "inUse",
    title: "다른 앱이 카메라를 쓰고 있습니다",
    message: "카메라를 사용 중인 다른 앱이나 탭을 닫고 다시 시도해주세요.",
  },
  unknown: {
    code: "unknown",
    title: "카메라를 시작할 수 없습니다",
    message: "잠시 후 다시 시도해주세요.",
  },
};

type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };
type TorchConstraintSet = MediaTrackConstraintSet & { torch?: boolean };
/** resizeMode 는 아직 표준 타입에 없지만 Chrome 계열에서 동작한다. */
type ResizeConstraints = MediaTrackConstraints & { resizeMode?: { ideal: string } };

export type CameraController = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  error: CameraError | null;
  videoSize: Size;
  hasMultipleCameras: boolean;
  torchSupported: boolean;
  torchOn: boolean;
  retry: () => void;
  toggleTorch: () => Promise<void>;
};

export function useCamera(params: {
  facingMode: FacingMode;
  active: boolean;
  /** 기기가 지원하는 최대 해상도로 요청할지 여부 */
  highResolution: boolean;
}): CameraController {
  const { facingMode, active, highResolution } = params;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestIdRef = useRef(0);

  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<CameraError | null>(null);
  const [videoSize, setVideoSize] = useState<Size>({ width: 0, height: 0 });
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  const stopStream = useCallback(() => {
    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
    }
    const video = videoRef.current;
    if (video) video.srcObject = null;
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  useEffect(() => {
    if (!active) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    let cancelled = false;

    const fail = (code: CameraErrorCode) => {
      if (cancelled || requestIdRef.current !== requestId) return;
      setError(ERROR_COPY[code]);
      setStatus("error");
    };

    const run = async () => {
      setError(null);
      setStatus("requesting");

      if (!window.isSecureContext) {
        fail("insecure");
        return;
      }
      const mediaDevices = navigator.mediaDevices;
      if (!mediaDevices || typeof mediaDevices.getUserMedia !== "function") {
        fail("unsupported");
        return;
      }

      stopStream();

      let stream: MediaStream;
      try {
        stream = await mediaDevices.getUserMedia({
          video: {
            facingMode,
            // 저장 화질은 여기서 결정된다. 프레임 일부만 잘라내므로 원본이 클수록 결과가 선명하다.
            width: { ideal: highResolution ? 3840 : 1920 },
            height: { ideal: highResolution ? 2160 : 1080 },
            // 브라우저가 임의로 축소/크롭하지 않도록 한다.
          } as ResizeConstraints,
          audio: false,
        });
      } catch (firstError) {
        if (isOverconstrained(firstError)) {
          // 해상도 제약을 만족하지 못하는 기기에서는 기본 설정으로 재시도한다.
          try {
            stream = await mediaDevices.getUserMedia({ video: true, audio: false });
          } catch (secondError) {
            fail(classifyError(secondError));
            return;
          }
        } else {
          fail(classifyError(firstError));
          return;
        }
      }

      if (cancelled || requestIdRef.current !== requestId) {
        for (const track of stream.getTracks()) track.stop();
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        try {
          await video.play();
        } catch {
          // 자동 재생이 막힌 경우에도 muted + playsInline 이면 사용자 제스처 후 재생된다.
        }
      }

      const [track] = stream.getVideoTracks();
      if (track) {
        if (highResolution) await upgradeResolution(track);
        const settings = track.getSettings();
        if (settings.width && settings.height) {
          setVideoSize({ width: settings.width, height: settings.height });
        }
        const capabilities: TorchCapabilities = track.getCapabilities?.() ?? {};
        setTorchSupported(Boolean(capabilities.torch));
      }

      if (cancelled || requestIdRef.current !== requestId) return;
      setStatus("ready");

      try {
        const devices = await mediaDevices.enumerateDevices();
        if (!cancelled) {
          setHasMultipleCameras(devices.filter((device) => device.kind === "videoinput").length > 1);
        }
      } catch {
        // 기기 목록을 못 읽어도 촬영에는 영향이 없다.
      }
    };

    void run();

    return () => {
      cancelled = true;
      requestIdRef.current += 1;
      stopStream();
    };
  }, [active, facingMode, highResolution, retryToken, stopStream]);

  // 실제 비디오 해상도는 메타데이터 로드 이후 / 회전 시점에 바뀔 수 있다.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const sync = () => {
      if (video.videoWidth && video.videoHeight) {
        setVideoSize({ width: video.videoWidth, height: video.videoHeight });
      }
    };
    sync();
    video.addEventListener("loadedmetadata", sync);
    video.addEventListener("resize", sync);
    return () => {
      video.removeEventListener("loadedmetadata", sync);
      video.removeEventListener("resize", sync);
    };
  }, [status]);

  // 화면 잠금 / 앱 전환 후 복귀 처리
  useEffect(() => {
    if (!active) return;

    const resume = () => {
      if (document.visibilityState !== "visible") return;
      const stream = streamRef.current;
      const video = videoRef.current;
      if (!stream || !video) return;
      const live = stream.getVideoTracks().some((track) => track.readyState === "live");
      if (!live) {
        setRetryToken((token) => token + 1);
        return;
      }
      if (video.paused) void video.play().catch(() => {});
    };

    document.addEventListener("visibilitychange", resume);
    window.addEventListener("pageshow", resume);
    return () => {
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("pageshow", resume);
    };
  }, [active]);

  const retry = useCallback(() => {
    setRetryToken((token) => token + 1);
  }, []);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as TorchConstraintSet] });
      setTorchOn(next);
    } catch {
      setTorchSupported(false);
    }
  }, [torchOn]);

  return {
    videoRef,
    status,
    error,
    videoSize,
    hasMultipleCameras,
    torchSupported,
    torchOn,
    retry,
    toggleTorch,
  };
}

/**
 * 첫 요청이 낮은 해상도로 잡힌 경우, 기기가 보고한 최대 해상도로 한 번 더 올려본다.
 * ideal 로만 요청하므로 실패하지 않고, 지원하지 않으면 그대로 유지된다.
 */
async function upgradeResolution(track: MediaStreamTrack): Promise<void> {
  try {
    const capabilities = track.getCapabilities?.();
    const settings = track.getSettings();
    const maxWidth = capabilities?.width?.max;
    const maxHeight = capabilities?.height?.max;
    if (!maxWidth || !maxHeight) return;

    const currentShortEdge = Math.min(settings.width ?? 0, settings.height ?? 0);
    const maxShortEdge = Math.min(maxWidth, maxHeight);
    // 이미 최대에 가깝다면 건드리지 않는다. (불필요한 재협상은 프리뷰가 끊길 수 있다)
    if (currentShortEdge >= maxShortEdge * 0.9) return;

    await track.applyConstraints({
      width: { ideal: maxWidth },
      height: { ideal: maxHeight },
      resizeMode: { ideal: "none" },
    } as ResizeConstraints);
  } catch {
    // 해상도 상향은 부가 기능이므로 실패해도 촬영에는 영향이 없다.
  }
}

function isOverconstrained(error: unknown): boolean {
  return error instanceof Error && (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError");
}

function classifyError(error: unknown): CameraErrorCode {
  if (!(error instanceof Error)) return "unknown";
  switch (error.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "denied";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return "notFound";
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return "inUse";
    case "TypeError":
      return "unsupported";
    default:
      return "unknown";
  }
}
