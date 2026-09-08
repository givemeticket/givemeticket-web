import { flushSync } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { resetFilterState, type FilterTab } from "../lib/dashboardFilterStore";
import { announceLeavingCardBehind } from "@/shared/animation/pageTransition/leavingCardBehindStore";

// 원래 DashboardLayout(대시보드 라우트에서만 조건부로 렌더링) 안에 있던 탭을
// UserAppShell의 고정 헤더로 옮겨서, 로그인/비로그인·페이지 종류와 무관하게
// 항상 떠있게 함. 예전엔 "지금 어느 탭이 활성인지"를 밑줄로 표시했는데, 그러려면
// UserAppShell이 "지금 대시보드 라우트인지"를 알아야 했음 — 항상 떠있는
// 전역 내비게이션으로 바꾸면서 그 구분 자체를 없앰(활성 표시는 대신 각 목록
// 페이지 상단의 제목(CampaignListTab의 pageTitle)이 담당함 — 어느 화면에서든
// 똑같이 보이는 단순한 링크 두 개일 뿐임).
//
// 로그인 여부 확인도 따로 안 함 — /mytickets, /mycampaigns 둘 다 이미
// ProtectedRoute로 보호돼 있어서, 비로그인 상태로 navigate()해도
// ProtectedRoute가 알아서 "/?redirect=..."로 보내고 로그인 후 원래
// 목적지로 되돌려줌(ProtectedRoute.tsx 참고) — 여기서 별도 처리 불필요.
export function HeaderTabs() {
  return (
    <div className="flex items-center gap-4">
      <HeaderTabLink to="/mytickets" tab="mytickets" label="나의 티켓" />
      <HeaderTabLink to="/mycampaigns" tab="mycampaigns" label="나의 행사" />
    </div>
  );
}

function HeaderTabLink({
  to,
  tab,
  label,
}: {
  to: string;
  tab: FilterTab;
  label: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function handleClick() {
    resetFilterState(tab);

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
      className="text-sm font-medium text-(--muted) transition-colors hover:text-(--paper)"
    >
      {label}
    </button>
  );
}
