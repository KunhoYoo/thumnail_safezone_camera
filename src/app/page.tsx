import { Camera, Download, LayoutTemplate, ShieldCheck, WifiOff } from "lucide-react";
import Link from "next/link";

import { PhonePreview } from "@/components/PhonePreview";

const FEATURES = [
  {
    icon: LayoutTemplate,
    title: "플랫폼별 안전영역",
    body: "Shorts · Reels · TikTok · 일반 세로 · 커스텀 프리셋을 카메라 위에 바로 표시합니다.",
  },
  {
    icon: Camera,
    title: "촬영 가이드",
    body: "삼분할선, 중앙선, 인물 · 제품 · 음식 · 텍스트 구도 가이드를 켜고 끌 수 있습니다.",
  },
  {
    icon: Download,
    title: "캡처와 공유",
    body: "가이드 포함 / 제거를 선택해 저장하거나 바로 공유할 수 있습니다.",
  },
  {
    icon: ShieldCheck,
    title: "서버 전송 없음",
    body: "카메라 영상과 사진은 기기 안에서만 처리되며 어디에도 업로드되지 않습니다.",
  },
  {
    icon: WifiOff,
    title: "설치해서 사용",
    body: "홈 화면에 추가하면 앱처럼 실행되고, 오프라인에서도 열립니다.",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col px-safe">
      <header className="pt-safe flex items-center justify-between px-5 pb-2">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-white">
            <span className="block h-3.5 w-2 rounded-[2px] border-2 border-black" aria-hidden="true" />
          </span>
          <span className="text-[15px] font-extrabold tracking-[0.14em]">SAFEFRAME</span>
        </div>
        <Link
          href="#features"
          className="rounded-full px-3 py-2 text-[13px] font-semibold text-white/55 active:text-white"
        >
          기능 보기
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-7 px-5 py-6">
        <div className="text-center">
          <h1 className="break-keep text-[25px] font-bold leading-[1.32] tracking-[-0.02em]">
            촬영 전에
            <br />
            UI에 가리는 영역을 확인하세요.
          </h1>
          <p className="mt-3 text-[13px] font-medium tracking-tight text-white/45">
            YouTube · Instagram · TikTok
          </p>
        </div>

        <PhonePreview className="max-w-[212px]" />
      </section>

      <section className="pb-safe px-5">
        <Link
          href="/camera"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[16px] font-bold text-black active:bg-white/85"
        >
          <Camera size={19} aria-hidden="true" />
          카메라 시작
        </Link>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-white/35">
          카메라 영상은 기기 안에서만 처리되며 서버로 전송되지 않습니다.
        </p>
      </section>

      <section id="features" className="mt-10 space-y-3 px-5 pb-16 pt-6">
        <h2 className="mb-4 text-[12px] font-bold uppercase tracking-[0.1em] text-white/40">기능</h2>
        {FEATURES.map((feature) => (
          <div key={feature.title} className="flex gap-3.5 rounded-2xl bg-white/[0.04] p-4">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/8">
              <feature.icon size={17} className="text-white/80" aria-hidden="true" />
            </span>
            <span className="flex-1">
              <span className="block text-[14px] font-semibold tracking-tight">{feature.title}</span>
              <span className="mt-1 block text-[12.5px] leading-relaxed text-white/50">{feature.body}</span>
            </span>
          </div>
        ))}

        <div className="pt-6 text-center">
          <Link
            href="/camera"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-white/10 px-6 text-[14px] font-semibold active:bg-white/20"
          >
            카메라 시작
          </Link>
        </div>

        <p className="pt-6 text-center text-[11px] text-white/25">
          플랫폼 UI는 업데이트에 따라 달라질 수 있어 프리셋은 참고용입니다.
        </p>
      </section>
    </main>
  );
}
