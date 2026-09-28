import { pct } from "@/lib/geometry";
import { getBlockRects, getRecommendRects, OVERLAY_COLORS } from "@/lib/overlayPaint";
import { getPreset } from "@/lib/presets";

type Props = {
  platformId?: string;
  className?: string;
};

/**
 * 랜딩용 세로 스마트폰 프레임 미리보기.
 * 실제 카메라 화면과 같은 프리셋 데이터를 사용해 예시 Safe Zone 을 그린다.
 */
export function PhonePreview({ platformId = "youtube-shorts", className = "" }: Props) {
  const preset = getPreset(platformId);
  const blocks = getBlockRects(preset);
  const recommends = getRecommendRects(preset);

  return (
    <div
      className={
        "relative aspect-[9/16] w-full overflow-hidden rounded-[28px] border border-white/12 bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.6)] " +
        className
      }
      aria-hidden="true"
    >
      {/* 예시 피사체 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#33333a] via-[#212126] to-[#101013]" />
      <div className="absolute left-1/2 top-[30%] h-[18%] w-[32%] -translate-x-1/2 rounded-full bg-white/18" />
      <div className="absolute left-1/2 top-[46%] h-[34%] w-[56%] -translate-x-1/2 rounded-t-[999px] bg-white/12" />

      {blocks.map((item) => (
        <div
          key={item.id}
          className="absolute"
          style={{
            left: pct(item.rect.x),
            top: pct(item.rect.y),
            width: pct(item.rect.width),
            height: pct(item.rect.height),
            backgroundColor: "rgba(" + OVERLAY_COLORS.block + ", 0.26)",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgba(" + OVERLAY_COLORS.block + ", 0.8)",
          }}
        />
      ))}

      {recommends.map((item) => (
        <div
          key={item.id}
          className="sf-breathe absolute"
          style={{
            left: pct(item.rect.x),
            top: pct(item.rect.y),
            width: pct(item.rect.width),
            height: pct(item.rect.height),
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: "rgba(" + OVERLAY_COLORS.safe + ", 0.95)",
          }}
        />
      ))}

      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold tracking-tight text-white/85">
        {preset.name}
      </span>
    </div>
  );
}
