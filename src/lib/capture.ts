import { containerRectToSource, type Rect, type Size } from "@/lib/geometry";
import type { GuideShape } from "@/lib/guides";
import { paintOverlay } from "@/lib/overlayPaint";
import type { PlatformPreset, ZoneStyle } from "@/types/camera";

/** 캡처 결과 긴 변 최대 길이 (메모리/공유 용량 보호) */
const MAX_LONG_EDGE = 2560;
const MIME_TYPE = "image/jpeg";
const QUALITY = 0.92;

export type CaptureVariant = { blob: Blob; url: string };

export type CaptureShot = {
  /** 오버레이 없는 원본 */
  clean: CaptureVariant;
  /** 가이드가 그려진 이미지 */
  overlay: CaptureVariant;
  width: number;
  height: number;
  platformId: string;
  createdAt: number;
};

export type CaptureOptions = {
  video: HTMLVideoElement;
  /** 프리뷰 컨테이너 크기 (CSS px) */
  container: Size;
  /** 프리뷰 컨테이너 좌표계의 프레임 영역 */
  frame: Rect;
  preset: PlatformPreset;
  opacity: number;
  zoneStyle: ZoneStyle;
  showLabels: boolean;
  grid: boolean;
  centerLine: boolean;
  guides: GuideShape[];
  /** 전면 카메라 미러링 상태 (프리뷰와 동일하게 저장) */
  mirror: boolean;
};

export class CaptureError extends Error {}

/**
 * 프리뷰에서 보이는 프레임 영역만 잘라 캡처한다.
 * 오버레이 포함/미포함 두 가지를 동시에 만들어 결과 화면에서 즉시 전환할 수 있게 한다.
 */
export async function captureShot(options: CaptureOptions): Promise<CaptureShot> {
  const { video, container, frame, mirror } = options;
  const source: Size = { width: video.videoWidth, height: video.videoHeight };

  if (!source.width || !source.height) {
    throw new CaptureError("비디오 프레임이 아직 준비되지 않았습니다.");
  }
  if (frame.width <= 0 || frame.height <= 0) {
    throw new CaptureError("촬영 프레임 크기를 계산할 수 없습니다.");
  }

  const sourceRect = containerRectToSource(frame, container, source);
  const longEdge = Math.max(sourceRect.width, sourceRect.height);
  const downscale = longEdge > MAX_LONG_EDGE ? MAX_LONG_EDGE / longEdge : 1;
  const width = Math.max(2, Math.round(sourceRect.width * downscale));
  const height = Math.max(2, Math.round(sourceRect.height * downscale));

  const cleanCanvas = createCanvas(width, height);
  const cleanCtx = get2d(cleanCanvas);
  cleanCtx.save();
  if (mirror) {
    cleanCtx.translate(width, 0);
    cleanCtx.scale(-1, 1);
  }
  cleanCtx.drawImage(
    video,
    sourceRect.x,
    sourceRect.y,
    sourceRect.width,
    sourceRect.height,
    0,
    0,
    width,
    height,
  );
  cleanCtx.restore();

  const overlayCanvas = createCanvas(width, height);
  const overlayCtx = get2d(overlayCanvas);
  overlayCtx.drawImage(cleanCanvas, 0, 0);
  paintOverlay(overlayCtx, {
    frame: { x: 0, y: 0, width, height },
    preset: options.preset,
    opacity: options.opacity,
    zoneStyle: options.zoneStyle,
    showLabels: options.showLabels,
    grid: options.grid,
    centerLine: options.centerLine,
    guides: options.guides,
  });

  const [cleanBlob, overlayBlob] = await Promise.all([toBlob(cleanCanvas), toBlob(overlayCanvas)]);

  return {
    clean: { blob: cleanBlob, url: URL.createObjectURL(cleanBlob) },
    overlay: { blob: overlayBlob, url: URL.createObjectURL(overlayBlob) },
    width,
    height,
    platformId: options.preset.id,
    createdAt: Date.now(),
  };
}

export function releaseShot(shot: CaptureShot | null): void {
  if (!shot) return;
  URL.revokeObjectURL(shot.clean.url);
  URL.revokeObjectURL(shot.overlay.url);
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function get2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new CaptureError("이 브라우저에서는 이미지 저장을 사용할 수 없습니다.");
  return ctx;
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new CaptureError("이미지를 만드는 데 실패했습니다."));
      },
      MIME_TYPE,
      QUALITY,
    );
  });
}
