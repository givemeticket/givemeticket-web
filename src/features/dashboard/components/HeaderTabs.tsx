import type { ComponentType } from "react";
import { flushSync } from "react-dom";
import { CalendarDays, Heart, Home, Ticket } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { resetFilterState, type FilterTab } from "../lib/dashboardFilterStore";
import { announceLeavingCardBehind } from "@/shared/animation/pageTransition/leavingCardBehindStore";

// 원래 DashboardLayout(대시보드 라우트에서만 조건부로 렌더링) 안에 있던 탭을
// UserAppShell의 고정 헤더로 옮겨서, 로그인/비로그인·페이지 종류와 무관하게
// 항상 떠있게 함.
//
// 활성 탭 표시: 한동안 아예 없었음(이 파일의 예전 버전 참고) — "상세/수정/
// 신청자목록 같은 화면에선 어느 탭도 정답이 아닌데, 그때도 억지로 하나를
// 활성으로 골라야 하나?"가 걱정이었음. 그런데 실제로는 그럴 필요가
// 없었음: 아래 HeaderTabLink가 정확히 `location.pathname === to`인 탭만
// 활성으로 표시하는데, 상세/수정/신청자목록 같은 화면의 경로는 애초에
// 이 네 탭의 경로 중 어디와도 일치하지 않아서 자동으로 "전부 비활성"이
// 됨 — 억지로 하나를 고르는 상황 자체가 안 생김. 그래서 templates/home-overview
// 템플릿을 참고해 아이콘 + 활성 탭 알약 배경을 다시 추가함(사용자 확인 후
// 진행, 2026-09-12).
//
// 로그인 여부 확인도 따로 안 함 — /mywish, /mytickets, /mycampaigns 모두
// 이미 ProtectedRoute로 보호돼 있어서, 비로그인 상태로 navigate()해도
// ProtectedRoute가 알아서 "/?redirect=..."로 보내고 로그인 후 원래
// 목적지로 되돌려줌(ProtectedRoute.tsx 참고) — 여기서 별도 처리 불필요.
// "/"(홈)만 예외 — ProtectedRoute 없이도 로그인 여부에 따라 스스로 다른
// 콘텐츠를 보여줌(RootRoute.tsx 참고).
export function HeaderTabs() {
  return (
    <div className="flex items-center gap-1">
      {/* 홈/찜한 행사는 아직 정렬·필터 UI가 없는 placeholder라 tab prop을
          안 줌(dashboardFilterStore.ts의 FilterTab 유니온에 편입 안 시킴 —
          나중에 "찜한 행사"에 진짜 정렬/필터가 생기면 그때 추가). */}
      <HeaderTabLink to="/" label="홈" icon={Home} />
      <HeaderTabLink to="/mywish" label="찜한 행사" icon={Heart} />
      <HeaderTabLink
        to="/mytickets"
        tab="mytickets"
        label="나의 티켓"
        icon={Ticket}
      />
      <HeaderTabLink
        to="/mycampaigns"
        tab="mycampaigns"
        label="나의 행사"
        icon={CalendarDays}
      />
    </div>
  );
}

function HeaderTabLink({
  to,
  tab,
  label,
  icon: Icon,
}: {
  to: string;
  /** 정렬/필터 상태가 있는 탭만 넘김(dashboardFilterStore.ts 참고) —
   * 없으면 클릭 시 필터 리셋을 건너뜀 */
  tab?: FilterTab;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isActive = location.pathname === to;

  function handleClick() {
    if (tab) resetFilterState(tab);

    if (location.pathname === to) {
      // 이미 그 페이지에 있는데 같은 탭을 또 눌렀을 땐 navigate()를 불러도
      // URL이 안 바뀌어서(location이 그대로라) 아무 일도 안 일어남 — 대신
      // "새로 진입한 것처럼" 데이터를 다시 받아오고(react-query 캐시
      // invalidate) 스크롤을 맨 위로 올림. 필터는 위에서 이미 리셋함.
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      window.scrollTo(0, 0);
      return;
    }

    // 혹시 지금 캠페인 상세 페이지가 떠있다면(카드가 layoutId를 갖고 있는
    // 상태라면), 그 카드의 짝이 도착할 탭 목록에 없을 수도 있음(예: "나의
    // 행사"에만 있는 캠페인) — 미리 알 방법이 없어서 항상 "짝 없음"으로
    // 가정하고 즉시 layoutId를 끄도록 알림. 안 그러면 카드가 방치되다가
    // 다른 요소들 페이드가 다 끝나야 사라지는 버그가 생김(animation.md 3번).
    // navigate()보다 먼저, flushSync로 동기적으로 반영되게 함(OwnerPanel의
    // onBeforeNavigateToNonCardPage와 같은 이유).
    flushSync(() => {
      announceLeavingCardBehind();
    });
    navigate(to);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
        isActive
          ? "font-semibold text-(--paper)"
          : "font-medium text-(--muted) hover:bg-(--ink-soft) hover:text-(--paper)"
      }`}
      style={isActive ? { backgroundColor: "var(--ink-soft)" } : undefined}
    >
      <Icon size={15} strokeWidth={1.75} />
      {label}
    </button>
  );
}
