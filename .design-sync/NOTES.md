# design-sync 저장소 메모 (givemeticket-web)

## 이 저장소의 특수한 상황

이 저장소는 별도의 컴포넌트 라이브러리 패키지가 아니라 앱 전체(SPA)다.
`package.json`에 `main`/`module`/`exports` 같은 라이브러리 진입점이 없고,
`npm run build`는 앱 전체(`tsc -b && vite build`)를 빌드한다. 그래서:

- 컨버터의 기본 "synth-entry" 모드(전체 `src/`를 스캔해서 export를 죄다
  긁어오는 방식)를 그대로 쓰면 페이지·레이아웃·라우트 가드까지 전부
  "컴포넌트"로 잘못 집어오게 된다.
- 대신 `.design-sync/entry.mjs`에 사용자와 합의한 컴포넌트 파일들만
  `export * from "..."`로 명시적으로 나열해서 `cfg.entry`로 지정했다.
  새 컴포넌트를 디자인 시스템에 추가하려면 이 파일에 한 줄 추가 + 아래
  `componentSrcMap`에도 추가해야 한다.
- `cfg.componentSrcMap`에 전체 컴포넌트를 이름→경로로 명시해뒀다(자동
  스캔에 의존하지 않음). 이래야 `.design-sync/entry.mjs`가 커버하는
  30개만 정확히 컴포넌트로 인식된다.

## 발견한 컨버터 버그 (수정한 것들)

1. **tsconfig 주석 제거 정규식이 `"@/*"` 같은 경로 별칭 키를 오인식함.**
   `lib/bundle.mjs`의 `tsconfigPathsPlugin`이 `/* ... */` 블록 주석을
   지우는 정규식을 쓰는데, TS paths 키인 `"@/*"` 문자열 안의 `/*`를 진짜
   블록 주석의 시작으로 착각해서, 그 뒤에 있는 진짜 주석(`/* Bundler mode */`
   같은)의 닫는 `*/`까지 통째로 지워버려 JSON이 깨졌다(`paths` 설정이
   날아감 → `@/` import가 전부 resolve 실패). `lib/bundle.mjs`는 포크
   금지 대상이라, 우회책으로 **`@/*` 별칭 정보만 담은 별도의 작은
   tsconfig 파일**(`.design-sync/tsconfig.paths.json`)을 만들어
   `cfg.tsconfig`가 그걸 가리키게 했다. 이 파일 안에는 실제 블록 주석이
   없어야 버그를 안 밟는다 — 새 필드를 추가할 때 절대 `/* ... */` 주석을
   넣지 말 것. (`.design-sync/` 안에 두었기 때문에 `baseUrl`은 저장소
   루트를 가리키도록 `".."`로 설정해야 한다 — `"."`로 하면 저장소 루트가
   아니라 `.design-sync/` 기준으로 잘못 해석된다.)

2. **Vite가 만든 CSS의 폰트 `url()`이 사이트 루트 절대경로라서 폰트가
   전부 안 실림.** 이 프로젝트는 Vite 빌드 산출물(`dist/assets/*.css`)을
   `cssEntry`로 쓰는데, 그 안의 `@font-face`들은 `url(/assets/xxx.woff2)`,
   `url(/fonts/xxx.woff2)`처럼 앞에 `/`가 붙은 사이트-루트 기준 경로다.
   `lib/css.mjs`의 `extractFonts`는 이런 URL을 `path.resolve(srcDir, url)`로
   처리하는데, Node의 `path.resolve`는 두 번째 인자가 `/`로 시작하면
   그것만으로 절대경로로 취급해버려서 Windows에서 `C:\assets\xxx.woff2`
   같은(실제로는 존재하지 않는) 엉뚱한 경로가 나왔다 — 결과적으로
   Pretendard 폰트가 전부 `[FONT_DANGLING]`으로 빠졌다. `css.mjs`는
   포크 금지 대상이 아니라서 `.design-sync/overrides/css.mjs`에 포크해서
   고쳤다(`cfg.libOverrides`에 기록해둠) — 절대경로 URL이면 srcDir부터
   상위 폴더로 올라가며 그 경로가 실제로 존재하는 위치를 찾도록 후보를
   여러 개 시도하게 바꿈.

## 미리보기 카드에서 `position: fixed` 오버레이가 잘려 보이는 문제

`Modal`처럼 `fixed inset-0`으로 화면 전체를 덮는 컴포넌트를 "single" 카드
모드로 미리보기하면, 패널이 세로로 반토막 잘려서 보이는(제목이 사라지고
설명/버튼만 보이는) 문제가 있었다. 원인은 이 프로젝트 코드가 아니라
design-sync가 생성하는 카드 HTML 자체에 있음: single 모드 카드는 스토리를
감싸는 wrapper(`#r0`, `.ds-single`)에 `transform:translateZ(0)`을 걸어두는데,
**CSS 스펙상 transform이 걸린 조상은 그 안의 `position:fixed` 자손의 기준점을
진짜 뷰포트에서 자기 자신으로 바꿔버린다.** 그 결과 fixed 오버레이의
containing block 높이가 0으로 계산되고, `items-center`로 세로 중앙 정렬된
패널이 그 0-높이 기준선을 중심으로 위아래 반씩 잘리게 된다. 실제 서비스
화면에서는 이런 transform 조상이 없어서 전혀 발생하지 않는, 순전히 이
미리보기 카드 프레임만의 문제다.

이 문제를 만드는 `emit.mjs`는 포크 금지 대상이라 고칠 수 없어서, 대신 **미리보기
쪽에서 `ReactDOM.createPortal(..., document.body)`로 그 transform 조상을
벗어나 `document.body`에 직접 마운트**하는 방식으로 우회했다(`Modal.tsx`
미리보기 참고). 컴포넌트 자체나 props 사용법은 바꾸지 않고 마운트 위치만
다르게 한 것이라 정당한 우회로 봄.

**`fixed` 포지셔닝을 쓰는 다른 컴포넌트를 미리보기 작성할 때도 이 패턴을
그대로 적용할 것**: `ConfirmDialog`, `DateTimePickerField`(내부에서
`Modal`을 씀)처럼 `Modal`을 감싸 쓰는 컴포넌트들도 같은 문제를 겪을 것이므로
동일하게 `createPortal(..., document.body)`로 감싸서 작성해야 함.

## guidelinesGlob을 비워둔 이유

기본 `guidelinesGlob`(`docs/*.md` 등)이 이 저장소의 `docs/TODO.md`,
`docs/animation.md`를 "디자인 가이드라인"으로 잘못 집어갔다. 이 두 파일은
실제로는 애니메이션 버그 트러블슈팅 기록/작업 목록이지, 디자인 에이전트가
참고할 만한 브랜드/비주얼 가이드 문서가 아니다. 그래서 `cfg.guidelinesGlob`를
빈 배열로 명시해서 아무것도 안 실리게 했다. 나중에 진짜 디자인 가이드
문서(색상/타이포그래피 규칙 등)가 생기면 그때 다시 지정할 것.

## 마운트 시 페이드인 애니메이션 때문에 미리보기가 완전히 빈 화면으로 캡처되는 문제

`AnimatedPageBackground`/`FadeSlide`(motion/react 기반, `initial: {opacity:0}` →
`animate: {opacity:1}`)를 내부적으로 쓰는 컴포넌트를 미리보기하면, 정적
스크린샷 캡처가 애니메이션이 끝나길 기다려주지 않아서 카드가 완전히 빈
화면으로 나오는 문제가 있었다(`CampaignSubPageShell`, `CampaignListTab`,
`MyTicketsTab`, `MyCampaignsTab`에서 실제로 발생 — 전부 신청자 목록/카드
페이지 레이아웃 계열). 컴포넌트 자체나 캡처 스크립트를 고치는 대신, motion
라이브러리가 공식 제공하는 전역 스위치를 미리보기 파일 최상단에서 켜서
해결함:

```tsx
import { MotionGlobalConfig } from "motion/react";
MotionGlobalConfig.skipAnimations = true;
```

이 설정은 그 미리보기 파일이 컴파일되는 페이지 안에서만 전역으로 적용되고
(다른 컴포넌트의 미리보기에는 영향 없음 — 각자 별도로 컴파일되는 독립된
페이지라서), 모든 motion 애니메이션을 즉시 최종 상태로 건너뛰게 만든다.
**`FadeSlide`/`AnimatedPageBackground`를 직접 쓰거나 내부적으로 거쳐가는
컴포넌트의 미리보기를 새로 작성할 때는 항상 이 두 줄을 파일 최상단에
추가할 것** — 스크린샷이 빈 화면으로 나오는데 콘솔 에러도 없고 DOM 텍스트도
비어있다면 십중팔구 이 문제다.

## 미리보기 작성 시 반복적으로 쓰인 패턴들 (30개 컴포넌트 작업하며 정리)

- **`useNavigate`/`useParams` 등 라우터 훅을 쓰는 컴포넌트**(`BackButton`,
  `BrandLogo`, `FullPageMessage`, `OwnerPanel`, `HeaderTabs`,
  `CampaignListTab`, `CampaignSubPageShell`, `UserMenu` 등)는 `react-router-dom`의
  `<MemoryRouter>`로 감싸지 않으면 "useNavigate() may be used only in the
  context of a `<Router>` component" 에러가 난다 — 이 파이프라인은 라우터
  컨텍스트를 자동으로 안 주기 때문. 새 컴포넌트를 프리뷰로 만들 때 이런
  훅을 쓰는지 먼저 확인하고 기본으로 `MemoryRouter`를 씌울 것.
- **`useQuery`로 데이터를 fetch하는 컴포넌트**(`CampaignListTab`,
  `MyTicketsTab`, `MyCampaignsTab`)는 격리된 `QueryClient`를 만들어
  `setQueryData(["campaigns", scope], [...])`로 캐시를 미리 채우고
  `QueryClientProvider`로 감쌀 것(retry/refetch 옵션은 꺼서 실제 네트워크
  요청이 안 나가게 함).
- **내부 state로만 열리는 오버레이/토글**(`UserMenu`의 드롭다운,
  `DateTimePickerField`의 달력)은 외부에서 강제로 열 prop이 없으면, 마운트
  직후 `useEffect`에서 실제 트리거 요소를 `querySelector(...).click()`으로
  프로그래밍적으로 눌러서 연다(진짜 클릭 핸들러를 그대로 이용하는 것이라
  정당한 방법). 이렇게 연 오버레이가 `position:fixed`를 쓴다면(`Modal`
  내부 사용 등) 위의 "position:fixed 오버레이가 잘리는 문제" 섹션대로
  `createPortal(..., document.body)`도 같이 적용해야 함.
- **마운트 직후 상호작용을 흉내낼 때는 `useEffect`가 아니라
  `useLayoutEffect`를 쓸 것.** `useEffect`는 첫 페인트 **이후** 비동기로
  실행되는데, 정적 캡처가 그 사이의 좁은 틈(아직 상태가 안 바뀐 첫 페인트)을
  찍어버리는 경쟁 상태가 실제로 발생했다(`Tooltip`의 touchstart dispatch
  사례 - 같은 코드가 실행마다 다른 결과를 냄을 직접 확인함). `useLayoutEffect`는
  DOM 커밋 직후 페인트 **전에** 동기 실행되므로 이 경쟁 상태를 원천적으로
  피한다.
- **DOM 이벤트를 dispatch할 때는 실제 핸들러가 붙은 요소(또는 그 자손)에서
  발생시킬 것.** 이벤트는 target에서 조상 방향으로만 버블링된다 — 핸들러보다
  바깥쪽(조상) 요소에 ref를 달고 거기서 dispatch하면 핸들러에 절대 도달하지
  않는다(`Tooltip` 사례).
- **브라우저 API가 헤드리스 캡처 환경에서 실패해서 state가 안 바뀌는 경우**
  (`CopyLinkButton`의 `navigator.clipboard.writeText`가 권한 문제로 reject됨,
  컴포넌트에 catch가 없어 실패가 조용히 삼켜짐): 컴포넌트를 고치는 대신
  프리뷰 파일에서 해당 브라우저 API를 항상 성공하는 스텁으로 바꿔치기하고
  실제 클릭을 재현하는 방식으로 해결.
- **사이트 루트 절대경로 정적 자산**(`BrandLogo`의 `/favicon-*.png`처럼
  `public/`에서 서빙되는 걸 전제로 한 `<img src="/...">`)은 ds-bundle
  정적 서버엔 그 파일이 없어서 깨진 이미지로 나온다 — 마운트 후
  `useEffect`로 해당 `<img>`의 `src`를 실제 파일(`public/...`)의 base64
  data URI로 교체해서 해결(컴포넌트 자체는 안 건드림).

## 재동기화(re-sync) 시 주의할 점

- **`cssEntry`는 매번 다시 확인해야 한다.** Vite가 CSS 파일명에 콘텐츠
  해시를 붙이기 때문에(`index-XXXXXXXX.css`), `npm run build`를 다시
  돌리면 파일명이 바뀐다. re-sync 전에 `npm run build`를 실행하고,
  `dist/assets/`에서 실제 생성된 CSS 파일명을 확인해서
  `.design-sync/config.json`의 `cssEntry` 값을 그 파일명으로 갱신할 것.
- **`.ds-sync/` 폴더는 매번 다시 스테이징해야 한다** (gitignore 대상,
  클론할 때마다 없음) — design-sync 스킬의 `cp -r` 단계를 다시 실행하고
  `.ds-sync/`에서 `npm i esbuild ts-morph @types/react`를 다시 설치할 것.

## 폰트 대체 관련 결정 (사용자 확인 없이 진행, 근거 있음)

`[FONT_MISSING] "Apple SD Gothic Neo"` 경고는 무시해도 된다. 실제
font-family 스택이 `Pretendard, -apple-system, BlinkMacSystemFont,
Apple SD Gothic Neo, Malgun Gothic, sans-serif`인데, 여기서 진짜 브랜드
폰트인 Pretendard는 이미 정상적으로 번들에 포함되어 있고, 그 뒤에 나열된
것들은 macOS/Windows에만 있는 시스템 폰트를 위한 폴백일 뿐이다. 애초에
배포할 수 없는(라이선스상) OS 시스템 폰트라 별도 조치가 필요 없다.

## 알려진 렌더 경고 (Known render warns)

- **`[RENDER_THIN] ConfirmDialog: variants render identically`** — 무시해도
  됨. `Default`(노란 확인 버튼)/`Danger`/`Withdraw`(둘 다 경고색 버튼) 3개
  cell을 스크린샷으로 직접 확인했고 배경색/문구가 서로 다르게 정확히
  렌더링됨 — 아마 텍스트 구조가 비슷해서(제목+설명+버튼 2개) 겹치는
  판정이 난 것으로 보임, 실제로는 다름.
- **`[GRID_OVERFLOW]`** (`CampaignFormFields`, `CampaignSubPageShell`,
  `DateTimePickerField`, `LoadingFade`, `LoadingScreen`, `ConfirmDialog`) —
  해결됨. `cfg.overrides`에 각각 `cardMode: "column"`(폼처럼 폭이 넓은 것)
  또는 `cardMode: "single"`(오버레이/fixed 포지셔닝 쓰는 것)을 추가해서
  카드 그리드 안에서 잘리지 않게 처리함(design-sync가 직접 제안한 설정).

## Re-sync risks (다음 sync가 주의해야 할 것)

- `.design-sync/entry.mjs`의 30개 컴포넌트 목록은 사람이 직접 고른
  것이라, 새로 만든 공용 컴포넌트가 있어도 자동으로 추가되지 않는다 —
  주기적으로 `src/shared/components/`, `src/features/*/components/`를
  훑어서 새로 생긴 컴포넌트가 있는지 사용자와 확인할 것.
- `cssEntry`가 가리키는 파일이 실제 앱 프로덕션 빌드 산출물이므로, 앱의
  CSS/폰트 구성(`src/index.css`)이 바뀌면 재빌드해서 다시 반영해야 한다.
- 렌더 검증(playwright)을 아직 한 번도 안 돌려봤다 — 다음 sync에서
  기회가 되면 설치해서 실제로 빈 화면으로 렌더링되는 컴포넌트가 없는지
  확인할 것.
