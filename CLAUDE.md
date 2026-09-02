# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

GiveMeTicket(기브미티켓)은 선착순 행사 신청("티켓팅") 플랫폼의 프론트엔드입니다. 주최자가 하나의 공유 링크로 행사를 열면, 정해진 오픈 시각에 먼저 신청한 사람 순서로 참가가 확정됩니다. 라이브 사이트: https://givemeticket.site

백엔드(Spring 기반)는 별도 저장소에서 다른 팀원이 개발하며, 이 저장소는 프론트엔드(React + TypeScript)만 포함합니다.

## Commands

- `npm run dev` — Vite 개발 서버 실행
- `npm run build` — `tsc -b && vite build` (타입체크 후 프로덕션 빌드)
- `npm run lint` — ESLint 실행 (`eslint .`)
- `npm run preview` — 빌드 결과 미리보기

테스트 프레임워크(Jest/Vitest 등)는 아직 구성되어 있지 않으며, 테스트 파일도 존재하지 않습니다.

배포는 Vercel이며(`vercel.json`), SPA 라우팅을 위해 모든 경로를 `index.html`로 rewrite합니다.

### 환경 변수

로컬 개발 시 `.env.local`에 다음 Vite 환경 변수가 필요합니다 (커밋되지 않음, `.env.example` 없음):
`VITE_API_BASE_URL`, `VITE_DEV_BYPASS_AUTH`, `VITE_KAKAO_CLIENT_ID`, `VITE_NAVER_CLIENT_ID`, `VITE_DISABLE_STRICT_MODE`

## 응답 언어

항상 한국어로 응답할 것.

## 작업 방식

- 사소한 수정이 아니면, 바로 구현하지 말고 먼저 계획(어떤 파일을 어떻게
  바꿀지)을 설명하고 승인을 기다릴 것.
- 애니메이션/페이지 전환 관련 버그는 순수 추론만으로 원인을 단정하지 말 것 —
  이 프로젝트에서 "이론상 맞다고 생각했는데 실제론 틀렸던" 경우가 반복적으로
  있었음. 확신이 안 서면 로그를 넣어서 실제 동작을 먼저 확인할 것.
- 작업 시작 전 `TODO.md`를 확인해서 이미 계획된 항목이랑 중복되지 않는지 볼
  것. 작업이 끝나면 `TODO.md`도 같이 갱신할 것(완료 항목 정리, 새로 발견한
  이슈 추가).
- 사용자가 애니메이션/전환 관련 문제를 "해결됐다"고 확인해주면, 그 원인과
  해결 방법을 `animation.md`에 새 항목으로 추가할 것(기존 항목들의 번호/형식
  참고). 반대로 확인 안 된 걸 먼저 적어두지 말 것.
- 큰 작업(특히 애니메이션/전환 관련) 시작 전엔 git 커밋 여부를 먼저 확인할 것.

## 참고 문서 (필요할 때 열어볼 것 — 상시 로드 안 해도 됨)

- `TODO.md`: 진행 예정 작업 목록.
- `animation.md`: 카드 확장 애니메이션/페이지 전환 관련 구현 시 반드시 참고할
  것. `CampaignCard.tsx`, `CampaignDetailPage.tsx`, `CampaignListTab.tsx`,
  `DashboardLayout.tsx`, 그리고 위에 나열된 애니메이션 관련 모듈 스토어들을
  건드리기 전엔 항상 참고할 것 — 겉보기엔 멀쩡해 보여도 실제로는 불안정한
  패턴들(예: `layoutId`를 마운트 이후 동적으로 켜고 끄는 것)이 여러 번
  확인됐고, 그 구체적인 사례들이 여기 정리돼 있음. 단, 전체를 다 읽을 필요는
  없음 — 문서 맨 위 "빠른 색인" 표에 항목별 줄 범위가 있으니, 지금 하려는
  작업과 관련된 번호의 구간만 찾아서 읽을 것.

## Architecture

### 호스트네임 기반 앱 분기

`src/router/AppRouter.tsx`가 `window.location.hostname`이 `admin.`으로 시작하는지에 따라 `UserApp`(일반 사용자)과 `AdminApp`(어드민)을 각각 `lazy()`로 나누어 로드합니다. 이렇게 두 앱의 번들이 서로 섞이지 않도록 최상위에서만 lazy import를 두는 것이 의도된 설계이며, 하위 페이지들은 정적 import입니다. `AdminApp`은 아직 placeholder(`AdminHome.tsx`) 수준이고, 실제 구현된 것은 `UserApp`(캠페인 신청/관리) 쪽입니다.

### 디렉토리 구조 (feature-sliced)

```
src/
├── router/      # AppRouter(도메인 분기), UserApp/AdminApp(라우트 트리), 레이아웃, 인증 가드
├── features/
│   ├── auth/       # OAuth 로그인(카카오/네이버), 인증 상태
│   ├── campaign/   # 캠페인(행사) CRUD, 신청/취소, 신청자 관리
│   ├── dashboard/  # "나의 티켓" / "나의 행사" 탭
│   └── admin/       # 어드민 (미개발, placeholder)
└── shared/        # feature 간 공유 컴포넌트/훅/유틸(axios client, 각종 store 등)
```

각 feature는 필요에 따라 `api/ components/ hooks/ lib/ pages/` 하위 구조를 따릅니다. **별도의 전역 `types/` 디렉토리는 없고**, 도메인 타입은 해당 feature의 `api/*.ts` 파일에 API 함수와 함께 정의됩니다 (예: `features/campaign/api/campaignApi.ts`의 `CampaignDetail`, `CampaignItem` 등). 경로 별칭 `@/*` → `./src/*` (vite.config.ts, tsconfig.app.json).

### 라우팅

`react-router-dom` v7의 `createBrowserRouter`/`RouterProvider`(data router 방식)를 사용합니다. 레이아웃 계층은 `UserAppShell`(고정 헤더) → `RootLayout`(페이지 전환 애니메이션) → `DashboardLayout`(탭 공유 레이아웃, 경로 세그먼트 없음) 순으로 중첩됩니다. `/campaigns/:shortCode`(상세)는 비로그인도 접근 가능하고, `/mytickets` `/mycampaigns` `/campaigns/create` 등은 `ProtectedRoute`로 보호됩니다.

### API / 인증

- 단일 axios 클라이언트가 `src/shared/lib/axiosClient.ts`에 있으며, `baseURL`은 `VITE_API_BASE_URL`, 요청 인터셉터가 저장된 토큰을 `Authorization: Bearer` 헤더로 자동 첨부합니다. 응답 인터셉터의 공통 에러 처리(예: 401)는 아직 TODO로 남아 있습니다.
- 소셜 로그인만 지원(카카오/네이버). 토큰은 `src/shared/lib/authToken.ts`를 통해 `localStorage`(`gmt_access_token`)에 저장됩니다.
- `useAuth()`(`features/auth/hooks/useAuth.ts`)는 현재 토큰 존재 여부만 동기적으로 확인하는 단순한 훅입니다(코드에 추후 `/me` 검증으로 전환 예정이라는 TODO 있음). `VITE_DEV_BYPASS_AUTH`로 개발 중 인증 우회 가능.

### 상태관리

전역 상태관리 라이브러리(Redux/Zustand 등)는 쓰지 않고 목적별로 나뉩니다:

1. **서버 상태**: `@tanstack/react-query` v5. `App.tsx`에서 `QueryClientProvider`로 최상위 구성(`retry: 1`, `refetchOnWindowFocus: false`). 각 feature는 `useQuery`를 감싼 커스텀 훅(`useMe`, `useCampaignDetailData` 등)을 둡니다.
2. **모듈 레벨 스토어 패턴** (이 저장소의 특징적 컨벤션): React state/Context 대신 모듈 스코프 변수 + `useSyncExternalStore`로 상태를 공유하는 파일들이 있습니다 — `pageTransitionStore`, `scrollPositionStore`/`scrollOffsetStore`, `initialDetailMountStore`, `leftToNonCardPageStore`, `returningCardStore`, `dashboardFilterStore`. 라우트 리마운트와 무관하게 값이 유지돼야 하는 경우(스크롤 복원, 카드 전환 애니메이션 매칭 등)에 의도적으로 채택되었으며, 각 파일 상단에 이유가 한글 주석으로 설명되어 있습니다. 여러 스토어의 `consumeXxx()` 함수는 한 번 읽으면 스스로 초기화되어, 다음 방문에 낡은 값이 재사용되는 것을 방지합니다.

### 스타일링

Tailwind CSS v4(`@tailwindcss/vite`)만 사용하고 CSS Modules/CSS-in-JS는 없습니다. `src/index.css`의 `:root`에 CSS 커스텀 프로퍼티 디자인 토큰(`--ink`, `--paper`, `--brand-blue` 등)을 정의하고, Tailwind v4의 임의값 문법(`bg-(--ink)` 등)으로 참조합니다. 페이지 전환·공유 요소 애니메이션은 `motion`(Framer Motion 후속) 라이브러리로 구현합니다(`layoutId` 기반, `AnimatePresence`).

## 코드 컨벤션

- 비자명한 로직에는 "왜 이렇게 했는지"를 설명하는 상세한 한글 주석이 일관되게 달려 있습니다. 새 코드를 작성할 때도 이 스타일을 따르세요.
- 1회성 effect(예: OAuth 콜백의 코드 교환)는 `useRef` 가드로 StrictMode의 개발 모드 이중 실행을 방지합니다.
- 로그아웃 시에는 애니메이션 전환 중 레이스 컨디션을 피하기 위해 `navigate()` 대신 의도적으로 `window.location.href = "/"`를 사용합니다(`useLogout.ts`).
- `verbatimModuleSyntax`가 켜져 있으므로 타입 임포트는 `import type`을 사용해야 합니다.
