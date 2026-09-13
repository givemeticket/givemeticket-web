import { flushSync } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { resetFilterState, type FilterTab } from "../lib/dashboardFilterStore";
import { announceLeavingCardBehind } from "@/shared/animation/pageTransition/leavingCardBehindStore";

// 헤더 탭(HeaderTabs.tsx)과 모바일 하단 탭 바(BottomTabBar.tsx)가 겉모습만
// 다르고 "활성 판정 + 클릭 시 동작"은 완전히 같아야 해서 뽑아낸 공용 훅.
// 원래 HeaderTabLink 안에 있던 로직을 그대로 옮긴 것 — 특히 클릭 시 동작은
// 미묘한 애니메이션 관련 처리가 섞여 있어서, 두 곳에 각자 다시 구현하면
// 하나만 고치고 다른 하나를 빠뜨리기 쉬움(예: announceLeavingCardBehind
// 누락 시 animation.md 3번과 같은 "카드가 방치되다 늦게 사라지는" 버그).
export function useTabLinkNavigation(to: string, tab?: FilterTab) {
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

  return { isActive, handleClick };
}
