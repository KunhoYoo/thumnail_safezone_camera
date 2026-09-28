"use client";

type Props = {
  onCapture: () => void;
  disabled?: boolean;
  busy?: boolean;
};

/** 카메라 앱과 같은 위치·크기의 셔터 버튼 */
export function CaptureButton({ onCapture, disabled = false, busy = false }: Props) {
  return (
    <button
      type="button"
      onClick={onCapture}
      disabled={disabled || busy}
      aria-label="사진 촬영"
      className="grid h-[74px] w-[74px] shrink-0 place-items-center rounded-full border-[3px] border-white/90 transition-transform active:scale-95 disabled:opacity-40"
    >
      <span
        className={
          "block h-[60px] w-[60px] rounded-full bg-white transition-transform " + (busy ? "scale-75" : "")
        }
      />
    </button>
  );
}
