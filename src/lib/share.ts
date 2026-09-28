export type ShareOutcome = "shared" | "downloaded" | "cancelled" | "failed";

type ShareCapableNavigator = Navigator & {
  canShare?: (data: ShareData) => boolean;
};

export function buildFileName(platformId: string, withGuide: boolean): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp =
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    "-" +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());
  return "safeframe-" + platformId + (withGuide ? "-guide" : "") + "-" + stamp + ".jpg";
}

export function canUseWebShare(blob?: Blob | null): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  const nav = navigator as ShareCapableNavigator;
  if (typeof nav.share !== "function") return false;
  if (!blob) return true;
  if (typeof nav.canShare !== "function" || typeof File === "undefined") return false;
  try {
    return nav.canShare({ files: [new File([blob], "safeframe.jpg", { type: blob.type })] });
  } catch {
    return false;
  }
}

/** 브라우저에서 바로 다운로드 (Web Share 미지원 fallback) */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Safari 에서 즉시 revoke 하면 저장이 취소되는 경우가 있어 지연 해제한다.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Web Share API 로 공유하고, 미지원 브라우저에서는 Blob 다운로드로 대체한다. */
export async function shareImage(blob: Blob, filename: string): Promise<ShareOutcome> {
  if (canUseWebShare(blob) && typeof File !== "undefined") {
    try {
      const file = new File([blob], filename, { type: blob.type });
      await navigator.share({ files: [file], title: "SAFEFRAME" });
      return "shared";
    } catch (error) {
      if (isAbortError(error)) return "cancelled";
      // 공유 실패 시에는 다운로드로 대체한다.
    }
  }

  try {
    downloadBlob(blob, filename);
    return "downloaded";
  } catch {
    return "failed";
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.name === "NotAllowedError");
}

/** iOS Safari 는 다운로드 UX 가 달라 안내 문구를 다르게 보여준다. */
export function isIosLike(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIpadOs = ua.includes("Macintosh") && typeof document !== "undefined" && "ontouchend" in document;
  return /iPad|iPhone|iPod/.test(ua) || isIpadOs;
}
