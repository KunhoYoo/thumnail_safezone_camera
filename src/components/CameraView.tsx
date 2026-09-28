"use client";

import type { ReactNode, RefObject } from "react";

import type { Rect } from "@/lib/geometry";

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>;
  frame: Rect;
  mirrored: boolean;
  /** 프레임 밖 영역을 어둡게 처리 */
  shade: boolean;
  visible: boolean;
  /** CSS filter 문자열 (프리뷰는 GPU 로 처리) */
  filter: string;
  children?: ReactNode;
};

/** 카메라 영상 + 프레임 바깥 음영. 오버레이는 children 으로 쌓는다. */
export function CameraView({ videoRef, frame, mirrored, shade, visible, filter, children }: Props) {
  return (
    <>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          transform: mirrored ? "scaleX(-1)" : undefined,
          filter: filter === "none" ? undefined : filter,
          opacity: visible ? 1 : 0,
          transition: "opacity 200ms ease-out, filter 180ms ease-out",
        }}
        playsInline
        autoPlay
        muted
        disablePictureInPicture
        aria-label="카메라 미리보기"
      />

      {shade && frame.width > 0 ? (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-0 top-0 w-full bg-black/45" style={{ height: Math.max(0, frame.y) }} />
          <div
            className="absolute left-0 w-full bg-black/45"
            style={{ top: frame.y + frame.height, bottom: 0 }}
          />
          <div
            className="absolute left-0 bg-black/45"
            style={{ top: frame.y, height: frame.height, width: Math.max(0, frame.x) }}
          />
          <div
            className="absolute bg-black/45"
            style={{ top: frame.y, height: frame.height, left: frame.x + frame.width, right: 0 }}
          />
          <div
            className="absolute border border-white/25"
            style={{ left: frame.x, top: frame.y, width: frame.width, height: frame.height }}
          />
        </div>
      ) : null}

      {children}
    </>
  );
}
