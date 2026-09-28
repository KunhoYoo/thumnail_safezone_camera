# SAFEFRAME

쇼츠 · 릴스 · 틱톡에서 **실제 UI에 가려지는 영역**을 카메라 화면 위에 겹쳐 보여주는 모바일 웹서비스입니다.
촬영 전에 구도를 잡을 수 있게 하는 것이 목적이며, 영상과 사진은 **기기 안에서만** 처리됩니다.

- 사이트 접속 → 카메라 허용 → 3초 안에 Safe Zone 확인
- 서버 없이 동작 (백엔드 불필요, 설정은 localStorage)
- PWA 설치 가능

---

## 1. 요구사항

| 항목 | 버전 |
| --- | --- |
| Node.js | 20.9 이상 (개발 환경 검증: 24.x) |
| npm | 10 이상 |
| 브라우저 | iOS Safari 16+, Android Chrome / Samsung Internet 최신 |

## 2. 설치

```bash
npm install
```

## 3. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000` 에서 확인합니다. `localhost` 는 보안 컨텍스트로 취급되므로 노트북 웹캠으로도 카메라 기능이 동작합니다.

### 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run dev:https` | 자체 서명 인증서로 HTTPS 개발 서버 실행 |
| `npm run dev:lan` | HTTPS + 외부 접속 허용 (휴대폰 실기기 테스트용) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript 검사 |
| `npm run icons` | PWA 아이콘 / favicon 재생성 |

## 4. HTTPS 테스트 (휴대폰 실기기)

카메라는 **HTTPS 또는 localhost** 에서만 동작합니다. 휴대폰에서 개발 서버에 접속하려면 HTTPS가 필요합니다.

```bash
npm run dev:lan
```

1. 최초 실행 시 Next.js가 `mkcert` 로 로컬 인증서를 생성합니다. (설치 안내가 나오면 그대로 진행)
2. 터미널에 표시된 `https://<PC 로컬 IP>:3000` 주소를 휴대폰에서 엽니다. (PC와 같은 Wi-Fi)
3. 자체 서명 인증서 경고가 나오면 "고급 → 계속 진행"을 선택합니다.
4. Windows 방화벽에서 Node.js의 사설 네트워크 접근을 허용합니다.

> 인증서 경고 없이 테스트하려면 Vercel 프리뷰 배포 URL을 사용하는 편이 가장 빠릅니다.

## 5. 카메라 권한 요구사항

- **보안 컨텍스트 필수**: `https://` 또는 `http://localhost`
- 권한 요청은 사용자가 `카메라 시작` 을 누른 뒤 `/camera` 에서 발생합니다.
- 권한이 거부되면 브라우저 설정에서 직접 허용해야 하며, 앱은 안내 화면과 `다시 시도` 버튼을 제공합니다.
  - iOS Safari: `설정 → Safari → 카메라` 또는 주소창 좌측 `ᴀA → 웹사이트 설정`
  - Android Chrome: 주소창 좌측 자물쇠 → 권한 → 카메라
- 다음 상황은 각각 다른 안내 문구로 처리됩니다: 권한 거부 / HTTPS 아님 / 카메라 없음 / 다른 앱이 사용 중 / 미지원 브라우저.

## 6. iOS 주의사항

- **Safari에서 열어야 합니다.** 인스타그램 · 카카오톡 등 인앱 브라우저는 `getUserMedia` 가 제한될 수 있습니다.
- 홈 화면에 추가하면 standalone 으로 실행되며, 이때도 카메라 권한을 다시 묻습니다.
- iOS는 **토치(플래시) 제어를 지원하지 않습니다.** 지원되는 기기에서만 플래시 버튼이 나타납니다.
- 저장 시 iOS는 다운로드 폴더로 저장됩니다. `공유` 버튼(Web Share)을 사용하면 사진 앱에 바로 저장할 수 있어 더 자연스럽습니다.
- 홈 인디케이터 영역은 `env(safe-area-inset-bottom)` 으로 대응되어 있습니다.

## 7. 배포 (Vercel)

1. 저장소를 GitHub에 올립니다.
2. Vercel에서 `New Project → Import` 후 기본값(Next.js)으로 배포합니다. 빌드 명령/출력 디렉터리 변경 불필요.
3. 환경 변수는 필수가 아닙니다. 배포 도메인을 metadata에 반영하려면 `NEXT_PUBLIC_APP_URL` 을 설정하세요.

```bash
npm i -g vercel
vercel
vercel --prod
```

Vercel은 기본적으로 HTTPS를 제공하므로 별도 설정 없이 카메라가 동작합니다.
보안 헤더(CSP, Permissions-Policy 등)는 `next.config.ts` 에서 응답 헤더로 주입됩니다.

## 8. 플랫폼 프리셋 수정 위치

모든 플랫폼 값은 **`src/lib/presets.ts` 한 곳**에서만 관리합니다. 컴포넌트에는 좌표가 하드코딩되어 있지 않습니다.

```ts
{
  id: "youtube-shorts",
  name: "YouTube Shorts",   // 설정 시트 표기
  shortName: "Shorts",      // 카메라 하단 칩 표기
  aspectRatio: "9:16",
  zones: { top: 0.08, bottom: 0.2, left: 0.04, right: 0.16 }, // 안전 마진 (0~1)
  overlays: [
    { id: "top", label: "상단 제목 · 상태", kind: "block", rect: { x: 0, y: 0, width: 1, height: 0.08 } },
    { id: "content", label: "콘텐츠 권장 영역", kind: "recommend", rect: { x: 0.06, y: 0.14, width: 0.76, height: 0.62 } },
  ],
}
```

- 모든 좌표는 **프레임 기준 0~1 비율**입니다. px 값을 넣지 마세요. (해상도가 달라도 동일하게 보이고, 캡처 시 Canvas에 같은 좌표로 다시 그려집니다.)
- `kind: "block"` = 플랫폼 UI가 가리는 영역(빨강), `kind: "recommend"` = 콘텐츠 권장 영역(초록 점선).
- `overlays` 를 생략하면 `zones` 값으로 상/하/좌/우 4개 영역이 자동 생성됩니다.
- 플랫폼 UI는 업데이트로 바뀔 수 있으므로 값은 주기적으로 확인이 필요합니다.

### 새 플랫폼 프리셋 추가

`PLATFORM_PRESETS` 배열에 항목을 추가하기만 하면 카메라 하단 칩과 설정 시트에 자동으로 나타납니다.

```ts
{
  id: "my-platform",
  name: "새 플랫폼",
  shortName: "New",
  aspectRatio: "9:16",
  description: "설정 시트에 표시할 한 줄 설명",
  zones: { top: 0.1, bottom: 0.22, left: 0.05, right: 0.16 },
}
```

`aspectRatio` 에 `"4:5"`, `"1:1"` 같은 값을 넣으면 프레임 비율 자체가 바뀝니다.

### 커스텀 Safe Zone (사용자 직접 조절)

`Custom` 칩을 선택하면 설정 시트에서 상/하/좌/우 마진 슬라이더가 열리고, 값은 자동 저장되어 다음 방문 시 복원됩니다.
조절 범위는 `src/store/cameraStore.ts` 의 `ZONE_RANGE` 에서 변경할 수 있습니다.

### 촬영 가이드 추가

`src/lib/guides.ts` 의 `GUIDE_OPTIONS` 와 `getGuideShapes()` 에 도형을 추가합니다.
`rect` / `ellipse` / `hline` / `vline` / `line` 을 조합하며, 이미지 분석 없이 오버레이로만 동작합니다.

## 9. 프로젝트 구조

```text
src/
 ├─ app/
 │   ├─ page.tsx           랜딩 / 권한 안내
 │   ├─ camera/page.tsx    카메라 화면 (상태 조합)
 │   ├─ manifest.ts        PWA manifest
 │   ├─ layout.tsx         metadata / viewport / SW 등록
 │   └─ globals.css        디자인 토큰 · safe-area 유틸
 ├─ components/
 │   ├─ CameraView.tsx     video + 프레임 바깥 음영
 │   ├─ SafeZoneOverlay.tsx 가림/권장 영역 (DOM 오버레이)
 │   ├─ GuideOverlay.tsx   삼분할선 · 중앙선 · 촬영 가이드 (SVG)
 │   ├─ PlatformSelector.tsx
 │   ├─ CameraControls.tsx 상단 바 + 하단 컨트롤
 │   ├─ CaptureButton.tsx
 │   ├─ SettingsSheet.tsx  Bottom Sheet
 │   ├─ CaptureResult.tsx  촬영 결과 화면
 │   ├─ PermissionState.tsx 권한/에러 UX
 │   ├─ PhonePreview.tsx   랜딩 미리보기
 │   └─ ServiceWorkerRegister.tsx
 ├─ hooks/
 │   ├─ useCamera.ts       getUserMedia · 전환 · 토치 · 복귀 처리
 │   ├─ useLocalSettings.ts 저장된 설정 + hydration
 │   └─ useElementSize.ts  회전/리사이즈 추적
 ├─ lib/
 │   ├─ presets.ts         ★ 플랫폼 프리셋
 │   ├─ guides.ts          촬영 가이드 도형
 │   ├─ geometry.ts        좌표 변환 (프리뷰 ↔ 원본 해상도)
 │   ├─ overlayPaint.ts    Canvas 오버레이 렌더링
 │   ├─ capture.ts         프레임 크롭 캡처
 │   └─ share.ts           Web Share / 다운로드 fallback
 ├─ store/cameraStore.ts   zustand + localStorage
 └─ types/camera.ts
```

### 좌표 변환에 대해

프리뷰 CSS 크기와 실제 비디오 해상도는 다릅니다. `object-fit: cover` 로 잘린 영역을 감안해
`geometry.ts` 의 `coverTransform()` / `containerRectToSource()` 가 프리뷰 좌표를 원본 픽셀 좌표로 변환하고,
`capture.ts` 가 그 영역만 잘라 저장합니다. 그래서 **프리뷰에서 본 프레임과 저장된 이미지가 정확히 일치**합니다.

## 10. 저장 / 공유

- 촬영 시 `가이드 포함` / `가이드 제거` 두 장을 동시에 만들어 결과 화면에서 즉시 전환합니다.
- `공유` 는 Web Share API(파일 공유 지원 시)만 노출되며, 미지원 브라우저에서는 `저장`(Blob 다운로드)으로 대체됩니다.
- 출력 포맷은 JPEG(품질 0.92), 긴 변 최대 2560px입니다. Canvas 출력이므로 **EXIF · 위치정보가 포함되지 않습니다.**

## 11. 개인정보 · 보안

- 카메라 영상은 기기 안에서만 처리되며 **서버로 전송되지 않습니다.**
- 이미지 자동 업로드 없음, 외부 분석/광고 SDK 없음, third-party 스크립트 없음.
- 서비스 워커는 앱 셸(HTML/JS/아이콘)만 캐시하며 사진은 캐시하지 않습니다.
- 응답 헤더: `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy: camera=(self)`.

## 12. 접근성

- 모든 아이콘 버튼에 `aria-label`, 토글은 `role="switch"`, 선택 칩은 `role="radio"` 를 사용합니다.
- 터치 타겟 최소 44px.
- Safe Zone을 색상만으로 구분하지 않도록 `채움 / 패턴 / 외곽선` 표시 방식을 제공합니다.
- `prefers-reduced-motion` 에서 애니메이션을 제거합니다.

## 13. QA 체크리스트

- [ ] iOS Safari: 권한 허용 / 거부 / 재시도
- [ ] iOS: 홈 화면 추가 후 standalone 실행, 홈 인디케이터 영역 겹침 없음
- [ ] Android Chrome · Samsung Internet: 전/후면 전환, 토치
- [ ] 화면 잠금 후 복귀, 다른 앱 갔다가 복귀 시 프리뷰 재개
- [ ] 세로/가로 회전 시 프레임 재계산
- [ ] 전면 미러링 ON/OFF 후 캡처 결과가 프리뷰와 동일한지
- [ ] 캡처 이미지 크기/방향, 가이드 포함/제거 전환
- [ ] 공유 지원 기기에서 Web Share, 미지원 기기에서 다운로드
- [ ] 설정이 새로고침 후에도 복원되는지 (`safeframe.camera.settings.v1`)
- [ ] 데스크톱에서 세로 프레임 프리뷰로 동작

## 14. 기술 스택

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · zustand · lucide-react
카메라는 MediaDevices API, 캡처는 Canvas API, 공유는 Web Share API를 사용하며 백엔드는 없습니다.

> 플랫폼 UI는 서비스 업데이트에 따라 변경될 수 있으므로 프리셋 값은 참고용입니다.
