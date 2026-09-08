import { Outlet } from "react-router-dom";
import { FadeSlide } from "@/shared/animation/components/FadeSlide";

// /mytickets, /mycampaigns 두 라우트가 공유하는 레이아웃 — 이제 배경 페이드
// 레이어랑 콘텐츠 폭(max-w-2xl px-6)만 담당함. 헤더(로고+탭+아바타)는
// UserAppShell이 전역으로 고정 처리함(여기서 빠짐) — 탭도 원래는 여기 있었는데,
// "어느 화면에서든 항상 보이는 전역 내비게이션"으로 바뀌면서 UserAppShell 쪽으로
// 옮겨감(HeaderTabs.tsx). 정렬/삭제표시 필터와 행사추가 버튼, 그리고 "지금
// 나의 티켓/나의 행사 중 뭘 보고 있는지" 제목은 CampaignListTab이 각자 직접
// 관리함. 전환 중 클릭 차단도 UserAppShell이 전역으로 처리함(예전엔 여기서
// useIsPresent()로 개별 처리했는데, 탭 전환처럼 AnimatePresence 키가 안 바뀌는
// 전환은 못 잡는 빈틈이 있었음 — pageTransitionStore.ts 참고).
export function DashboardLayout() {
  return (
    <div className="relative flow-root h-full text-(--paper)">
      {/* 배경색 전용 레이어. 독립적으로 페이드시켜야 함 — 안 그러면 이 화면이 사라지는
          동안에도 불투명한 배경이 화면을 계속 덮어서, 그 밑에서 나타나는 상세 페이지가
          거의 끝까지 안 보이다가 마지막 순간에 갑자기 드러나는 문제가 생김. */}
      <FadeSlide className="absolute inset-0 -z-10 bg-(--ink)" slide={false} />

      {/* pt-8 — CampaignSubPageShell/CampaignDetailPage와 같은 값으로 맞춤(둘
          다 헤더 바로 아래 오는 콘텐츠 컨테이너라 동일한 여백 컨벤션을 씀) */}
      <main className="mx-auto max-w-2xl px-6 pt-8 pb-10">
        <Outlet />
      </main>
    </div>
  );
}
