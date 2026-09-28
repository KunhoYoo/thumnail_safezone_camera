import type { Metadata, Viewport } from "next";

import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
