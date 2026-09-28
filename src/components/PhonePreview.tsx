import { getCssFilter } from "@/lib/filters";
import { pct } from "@/lib/geometry";
import { getBlockRects, getRecommendRects, OVERLAY_COLORS } from "@/lib/overlayPaint";
import { getPreset } from "@/lib/presets";

type Props = {
  platformId?: string;
  /** 미리보기 장면에 적용할 필터 */
  filterId?: string;
  className?: string;
};

/**
 * 랜딩용 세로 스마트폰 프레임 미리보기.
 * 실제 카메라 화면과 같은 프리셋 데이터를 사용해 예시 Safe Zone 을 그린다.
 */
export function PhonePreview({ platformId = "youtube-shorts", filterId = "portrait", className = "" }: Props) {
  const preset = getPreset(platformId);
  const blocks = getBlockRects(preset);
  const recommends = getRecommendRects(preset);

  return (
    <div
      className={
        "relative aspect-[9/16] w-full overflow-hidden rounded-[30px] bg-surface shadow-[0_24px_70px_-12px_rgba(0,0,0,0.85)] ring-1 ring-white/12 " +
        className
      }
      aria-hidden="true"
    >
      {/* 예시 장면 — 필터가 적용되는 영역 (오버레이는 필터 영향을 받지 않는다) */}
      <div className="absolute inset-0" style={{ filter: getCssFilter(filterId, 1) }}>
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(165deg, #2f3a4d 0%, #1b2130 48%, #0d1014 100%)" }}
        />
        {/* 따뜻한 키 라이트 */}
        <div
          className="absolute -left-[12%] top-[6%] h-[42%] w-[72%]"
          style={{
            background: "radial-gradient(closest-side, rgba(255,186,120,0.5), transparent)",
            filter: "blur(20px)",
          }}
        />
        {/* 인물 실루엣 */}
        <div
          className="absolute left-1/2 top-[27%] h-[24%] w-[40%] -translate-x-1/2 rounded-full"
          style={{ background: "radial-gradient(62% 62% at 38% 28%, #f2d3b1, #cb9d75 68%, #8d684d 100%)" }}
        />
        <div
          className="absolute left-1/2 top-[49%] h-[42%] w-[66%] -translate-x-1/2 rounded-t-[999px]"
          style={{ background: "linear-gradient(180deg, #47617e 0%, #223549 100%)" }}
        />
        {/* 차가운 림 라이트 */}
        <div
          className="absolute -right-[10%] bottom-[8%] h-[38%] w-[58%]"
          style={{
            background: "radial-gradient(closest-side, rgba(96,162,255,0.32), transparent)",
            filter: "blur(24px)",
          }}
        />
      </div>

      {blocks.map((item) => (
        <div
          key={item.id}
          className="absolute"
          style={{
            left: pct(item.rect.x),
            top: pct(item.rect.y),
            width: pct(item.rect.width),
            height: pct(item.rect.height),
            backgroundColor: "rgba(" + OVERLAY_COLORS.block + ", 0.17)",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgba(" + OVERLAY_COLORS.block + ", 0.62)",
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
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: "rgba(" + OVERLAY_COLORS.safe + ", 0.8)",
          }}
        />
      ))}

      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-medium tracking-tight text-white/75 backdrop-blur-sm">
        {preset.name}
      </span>
    </div>
  );
}
