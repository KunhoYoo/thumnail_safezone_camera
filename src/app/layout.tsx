import type { Metadata, Viewport } from "next";

import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const FALLBACK_SITE_URL = "http://localhost:3000";

/**
 * 배포 도메인 결정.
 * 환경 변수가 "빈 문자열"로 주입되는 경우가 있어 값이 실제로 있는지까지 확인하고,
 * 형식이 잘못되면 빌드를 깨뜨리지 않고 다음 후보로 넘어간다.
 */
function resolveSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value) continue;
    const withProtocol = /^https?:\/\//i.test(value) ? value : "https://" + value;
    try {
      return new URL(withProtocol).origin;
    } catch {
      // 형식이 잘못된 값은 무시하고 다음 후보를 확인한다.
    }
  }

  return FALLBACK_SITE_URL;
}

const siteUrl = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "SAFEFRAME",
  title: "SAFEFRAME — 촬영 전에 UI 가림 영역 확인",
  description:
    "YouTube Shorts · Instagram Reels · TikTok 의 UI 가림 영역을 카메라 화면 위에 표시해 촬영 전에 구도를 잡을 수 있는 무료 도구입니다. 영상은 기기 안에서만 처리됩니다.",
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    title: "SAFEFRAME",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: "SAFEFRAME",
    title: "SAFEFRAME — 촬영 전에 UI 가림 영역 확인",
    description: "쇼츠 · 릴스 · 틱톡 안전영역을 카메라 위에 바로 표시합니다.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body className="bg-ink text-white antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
