## GiveMeTicket 디자인 시스템 사용 가이드

GiveMeTicket(기브미티켓)은 선착순 행사 신청("티켓팅") 플랫폼입니다. 아래 컴포넌트들은
실제 프로덕션 앱(`givemeticket.site`)에서 그대로 가져온 것으로, 재구현이 아닙니다.

### 필수 wrapper (조건부)

이 디자인 시스템 전체를 감싸는 공통 root provider는 없습니다 — 대부분의 컴포넌트는
props만 주면 바로 렌더링됩니다. 다만 아래 두 종류는 사용하는 화면에 해당 컨텍스트가
없으면 에러가 납니다:

- **라우팅 훅을 쓰는 컴포넌트** (`BackButton`, `BrandLogo`, `FullPageMessage`,
  `OwnerPanel`, `HeaderTabs`, `UserMenu`, `CampaignListTab`, `MyTicketsTab`,
  `MyCampaignsTab`, `CampaignSubPageShell`): `react-router-dom`의 `useNavigate`/
  `useLocation`을 내부에서 직접 호출합니다. 화면을 만들 때 `<BrowserRouter>` 또는
  `<MemoryRouter>` 같은 라우터 컨텍스트 **안에서** 써야 합니다.
- **데이터를 fetch하는 컴포넌트** (`CampaignListTab`, `MyTicketsTab`,
  `MyCampaignsTab`): `@tanstack/react-query`의 `useQuery`를 씁니다. 화면을
  구성할 때 `QueryClientProvider`(`new QueryClient()`)로 감싸야 합니다. 이
  컴포넌트들은 실제 서버 데이터가 오기 전까지 로딩 상태를 보여주므로, 프로토타입에서는
  데이터가 이미 있는 화면을 만들고 싶다면 쿼리 캐시에 값을 미리 채워두는 방식을
  참고하세요(`_preview` 폴더의 예시 참고).

### 스타일링 방식 — Tailwind v4 유틸리티 클래스 + CSS 커스텀 프로퍼티 토큰

클래스 기반 스타일 시스템이 아니라, **색상은 전부 CSS 커스텀 프로퍼티(디자인 토큰)로
정의**되어 있고 Tailwind v4의 임의값 문법(`bg-(--token-name)`)으로 참조합니다. 새 화면을
만들 때도 아래 토큰을 그대로 쓰세요 — 색상 값을 직접 하드코딩하지 마세요.

| 토큰 | 용도 |
|---|---|
| `--ink` | 카드/패널의 기본 배경색 (어두운 톤) |
| `--ink-soft` | `--ink`보다 옅은 보조 배경 (아이콘 원형 배경, 종료 상태 뱃지 배경 등) |
| `--paper` | 기본 텍스트 색상 (밝은 톤 — `--ink` 배경 위 본문) |
| `--muted` | 보조/설명 텍스트 색상 |
| `--line` | 테두리/구분선 색상 |
| `--brand-yellow` | 메인 액션(신청하기 버튼 등) 배경색 |
| `--on-yellow` | `--brand-yellow` 배경 위에 올라가는 텍스트 색 |
| `--brand-blue` | 보조 브랜드색(포커스 링, "예정" 상태 뱃지 등) |
| `--brand-blue-dim` | `--brand-blue`보다 옅은 톤(뱃지 배경) |
| `--on-brand` | 브랜드색 배경 위 텍스트 색 |
| `--warn` | 경고/위험 액션(삭제, 매진, 임박 카운트다운) 배경색 |
| `--deleted` | 삭제된 항목 전용 배경색 |

사용 예: `<p className="text-(--paper)">제목</p>`, `<div style={{backgroundColor:
"var(--ink)"}}>...</div>` (두 방식 모두 실제 컴포넌트 코드에 섞여 있습니다).

폰트는 **Pretendard**(한국어 브랜드 폰트)가 이미 번들에 포함되어 있고, 컴포넌트들이
기본적으로 이 폰트로 렌더링됩니다 — 별도 설정 불필요.

### 진짜 스타일 소스를 확인하려면

`styles.css`(그리고 그 안에서 import하는 `_ds_bundle.css`)에 위 토큰들의 실제 정의와
모든 컴포넌트 CSS가 들어 있습니다. 새 조합을 만들기 전에 이 파일과 각 컴포넌트의
`.prompt.md`를 먼저 확인하세요.

### 예시 — 실제 화면 조합 패턴

카드형 리스트 아이템(`CampaignCard`)은 상태(`status`)에 따라 뱃지 색이 완전히
달라지는 것이 핵심 패턴입니다. 새 리스트 화면을 만들 때는 이 컴포넌트를 그대로
가져다 실제 데이터 형태(`title`, `status`, `openAtLabel`, `remainingStock`/
`totalStock`, `ownerNickname`)만 채워서 쓰세요:

```tsx
<CampaignCard
  title="2026 신년 팬미팅 - 선착순 입장"
  status="OPEN"
  openAtLabel="1월 20일 20:00 오픈"
  remainingStock={12}
  totalStock={200}
  ownerNickname="givemeticket_official"
  onClick={() => {}}
/>
```

액션 버튼은 `PrimaryButton`(브랜드 노란색, 메인 액션)과 `SecondaryButton`(테두리만,
보조 액션)을 상황에 맞게 조합하세요 — 폭이 자주 바뀌는 버튼(카운트다운 등)에는
`FixedWidthLabel`로 감싸 레이아웃이 흔들리지 않게 합니다.
