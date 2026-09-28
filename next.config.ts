import path from "node:path";

import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * 카메라 앱이므로 외부 스크립트를 쓰지 않는다는 전제로 CSP 를 좁게 잡는다.
 * - 개발 모드에서는 Turbopack HMR 을 위해 eval / websocket 을 허용한다.
 * - Next 가 삽입하는 인라인 부트스트랩 스크립트 때문에 script-src 에 'unsafe-inline' 이 필요하다.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' blob: data:",
  "media-src 'self' blob: mediastream:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
  isDev ? "connect-src 'self' ws: wss:" : "connect-src 'self'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // 상위 폴더의 lock 파일 때문에 프로젝트 루트가 잘못 잡히는 것을 막는다.
  turbopack: { root: path.resolve(process.cwd()) },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
          // 카메라만 이 사이트에 허용하고 나머지 센서는 차단한다.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
