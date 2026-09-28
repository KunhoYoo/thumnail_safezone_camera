"use client";

import { Camera, CameraOff, Loader2, Lock, MonitorSmartphone } from "lucide-react";
import Link from "next/link";

import type { CameraError, CameraStatus } from "@/hooks/useCamera";

type Props = {
  status: CameraStatus;
  error: CameraError | null;
  onRetry: () => void;
};

/** 권한 요청 중 / 실패 상태 화면. 개발자용 에러 메시지는 노출하지 않는다. */
export function PermissionState({ status, error, onRetry }: Props) {
  if (status === "ready") return null;

  const requesting = status === "requesting" || status === "idle";

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-ink px-8 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/8">
        {requesting ? (
          <Loader2 size={28} className="animate-spin text-white/70" aria-hidden="true" />
        ) : (
          <ErrorIcon code={error?.code} />
        )}
      </div>

      {requesting ? (
        <div className="space-y-2">
          <h1 className="text-[19px] font-bold tracking-tight">카메라를 준비하고 있어요</h1>
          <p className="text-[14px] leading-relaxed text-white/55">
            권한 요청 창이 뜨면 <span className="font-semibold text-white/80">허용</span>을 눌러주세요.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <h1 className="text-[19px] font-bold tracking-tight">{error?.title ?? "카메라를 시작할 수 없습니다"}</h1>
          <p className="text-[14px] leading-relaxed text-white/60">{error?.message}</p>
          {error?.hint ? (
            <p className="text-[12px] leading-relaxed text-white/40">{error.hint}</p>
          ) : null}
        </div>
      )}

      {!requesting ? (
        <div className="mt-2 w-full max-w-[320px] space-y-2.5">
          <button
            type="button"
            onClick={onRetry}
            className="h-13 min-h-12 w-full rounded-2xl bg-white text-[15px] font-bold text-black active:bg-white/85"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-white/10 text-[14px] font-semibold text-white/80 active:bg-white/20"
          >
            처음으로
          </Link>
        </div>
      ) : null}

      <p className="mt-2 max-w-[300px] text-[11px] leading-relaxed text-white/35">
        카메라 영상은 기기 안에서만 처리되며 서버로 전송되지 않습니다.
      </p>
    </div>
  );
}

function ErrorIcon({ code }: { code?: CameraError["code"] }) {
  const size = 28;
  if (code === "insecure") return <Lock size={size} className="text-white/70" aria-hidden="true" />;
  if (code === "notFound" || code === "unsupported")
    return <MonitorSmartphone size={size} className="text-white/70" aria-hidden="true" />;
  if (code === "denied") return <CameraOff size={size} className="text-white/70" aria-hidden="true" />;
  return <Camera size={size} className="text-white/70" aria-hidden="true" />;
}
