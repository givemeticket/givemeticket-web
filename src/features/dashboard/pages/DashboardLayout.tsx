import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { FadeSlide } from "@/shared/animation/components/FadeSlide";

// /mywish, /mytickets, /mycampaigns 라우트가 공유하는 레이아웃 — 이제 배경
// 페이드 레이어랑 콘텐츠 폭(max-w-220 px-6)만 담당함. 헤더(로고+탭+아바타)는
// UserAppShell이 전역으로 고정 처리함(여기서 빠짐) — 탭도 원래는 여기 있었는데,
// "어느 화면에서든 항상 보이는 전역 내비게이션"으로 바뀌면서 UserAppShell 쪽으로
// 옮겨감(HeaderTabs.tsx). 정렬/삭제표시 필터와 행사추가 버튼, 그리고 "지금
// 나의 티켓/나의 행사 중 뭘 보고 있는지" 제목은 CampaignListTab이 각자 직접
// 관리함. 전환 중 클릭 차단도 UserAppShell이 전역으로 처리함(예전엔 여기서
// useIsPresent()로 개별 처리했는데, 탭 전환처럼 AnimatePresence 키가 안 바뀌는
// 전환은 못 잡는 빈틈이 있었음 — pageTransitionStore.ts 참고).
//
// children은 선택적 — 위 세 라우트처럼 라우트 중첩(`<Outlet/>`)으로 쓰이는 게
// 기본이지만, RootRoute.tsx가 로그인 상태의 "/"에서 이 레이아웃을 라우트가
// 아니라 컴포넌트로 직접 조립해서(`<DashboardLayout><HomeTab /></DashboardLayout>`)
// "홈" 탭 콘텐츠를 끼워 넣을 수 있게 함.
export function DashboardLayout({ children }: { children?: ReactNode } = {}) {
  return (
    <div className="relative flow-root h-full text-(--paper)">
      {/* 배경색 전용 레이어. 독립적으로 페이드시켜야 함 — 안 그러면 이 화면이 사라지는
          동안에도 불투명한 배경이 화면을 계속 덮어서, 그 밑에서 나타나는 상세 페이지가
          거의 끝까지 안 보이다가 마지막 순간에 갑자기 드러나는 문제가 생김. */}
      <FadeSlide className="absolute inset-0 -z-10 bg-(--ink)" slide={false} />

      {/* pt-8 — CampaignSubPageShell/CampaignDetailPage와 같은 값으로 맞춤(둘
          다 헤더 바로 아래 오는 콘텐츠 컨테이너라 동일한 여백 컨벤션을 씀).
          폭은 max-w-2xl(672px, 앱 전체가 공유하던 값)이 아니라 880px(max-w-220)로 —
          스퀘어 카드 그리드(264px 고정 트랙 + 20px gap)가 실제로 여러 열
          보이려면 더 넓은 컨테이너가 필요함(672px 안에서는 항상 2열까지만
          들어감). 처음엔 템플릿 값 그대로 1080px을 썼는데, 그러면 3열
          (264*3+20*2=832px)을 넣고도 200px 가까운 빈 여백이 오른쪽에 남아서
          그리드가 왼쪽으로 쏠려 보이고("행사 추가" 버튼도 justify-between이라
          그 넓은 빈 공간 끝까지 밀려나 카드 그리드와 동떨어져 보임 — 사용자가
          실제로 이 두 문제를 지적함), 880px(px-6 뺀 실제 안쪽 폭 832px)로
          줄여서 3열이 여백 없이 정확히 꽉 채우게 함. 이 값은 우연히
          CampaignDetailPage.tsx의 880px과 정확히 같아서, 두 페이지 폭이
          하나로 통일됨(그 덕에 UserAppShell.tsx 헤더도 같은 880px로 넓힘 —
          더 이상 "어느 쪽 폭에 맞출지" 고민할 필요가 없어짐). */}
      <main className="mx-auto max-w-220 px-6 pt-8 pb-10">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
