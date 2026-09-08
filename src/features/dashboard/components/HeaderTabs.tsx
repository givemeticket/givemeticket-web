import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { resetFilterState, type FilterTab } from "../lib/dashboardFilterStore";

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
