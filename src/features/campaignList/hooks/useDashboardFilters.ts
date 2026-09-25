import { useSyncExternalStore } from "react";
import {
  getFilterState,
  setFilterState,
  subscribeToFilterState,
  type FilterTab,
} from "../lib/dashboardFilterStore";

// activeTab이 바뀔 때마다 그 탭에 저장돼있던 정렬/필터 값을 다시 불러오고,
// 값이 바뀌면 저장소에도 같이 반영하는 로직을 한데 모음. DashboardLayout이 이걸
// 직접 들고 있으면 "실제로 화면에 뭘 그리는지"가 이 동기화 코드에 묻혀서 안 보이길래 분리함.
//
// dashboardFilterStore를 useSyncExternalStore로 직접 구독함 — 예전엔 useState로
// 복사해뒀다가 "activeTab이 바뀌었는지"를 렌더링 중에 비교해서만 다시 불러왔는데,
// 그러면 "이미 보고 있는 탭을 또 클릭"해서 resetFilterState가 불려도(activeTab
// 값 자체는 안 바뀌므로) 화면이 그 리셋을 반영하지 못하는 버그가 있었음(실제로
// 겪음 — HeaderTabs.tsx 참고). store를 직접 구독하면 store가 바뀌는 모든
// 경우(탭 전환이든, 같은 탭 재클릭으로 인한 리셋이든)에 항상 최신값을 그대로 반영함.
export function useDashboardFilters(activeTab: FilterTab) {
  const state = useSyncExternalStore(subscribeToFilterState, () =>
    getFilterState(activeTab),
  );

  function setSortBy(v: string) {
    setFilterState(activeTab, { sortBy: v });
  }
  function setSortDirection(v: "asc" | "desc") {
    setFilterState(activeTab, { sortDirection: v });
  }
  function setShowExpiredOnly(v: boolean) {
    setFilterState(activeTab, { showExpiredOnly: v });
  }

  return {
    sortBy: state.sortBy,
    sortDirection: state.sortDirection,
    showExpiredOnly: state.showExpiredOnly,
    setSortBy,
    setSortDirection,
    setShowExpiredOnly,
  };
}
