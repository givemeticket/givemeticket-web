import { useState } from "react";
import {
  getFilterState,
  setFilterState,
  type FilterTab,
} from "../lib/dashboardFilterStore";

// activeTab이 바뀔 때마다 그 탭에 저장돼있던 정렬/필터 값을 다시 불러오고,
// 값이 바뀌면 저장소에도 같이 반영하는 로직을 한데 모음. DashboardLayout이 이걸
// 직접 들고 있으면 "실제로 화면에 뭘 그리는지"가 이 동기화 코드에 묻혀서 안 보이길래 분리함.
export function useDashboardFilters(activeTab: FilterTab) {
  const [sortBy, setSortByState] = useState(
    () => getFilterState(activeTab).sortBy,
  );
  const [sortDirection, setSortDirectionState] = useState<"asc" | "desc">(
    () => getFilterState(activeTab).sortDirection,
  );
  const [showExpiredOnly, setShowExpiredOnlyState] = useState(
    () => getFilterState(activeTab).showExpiredOnly,
  );

  // 탭을 전환하면, 그 탭에 저장돼있던 값으로 다시 불러옴. 이펙트 대신 "렌더링
  // 중 state를 비교해서 다르면 그 자리에서 다시 set"하는 리액트 공식 패턴을
  // 씀 — 이펙트로 하면 지난 탭의 값으로 한 번 그려졌다가 이펙트가 실행되고
  // 나서야 새 값으로 다시 그려지는 깜빡임이 생기지만(react-hooks/set-state-in-effect
  // 경고도 이 패턴 자체를 지적함), 렌더링 중 비교+set은 화면에 그려지기 전에
  // 즉시 반영됨.
  const [lastActiveTab, setLastActiveTab] = useState(activeTab);
  if (activeTab !== lastActiveTab) {
    const saved = getFilterState(activeTab);
    setSortByState(saved.sortBy);
    setSortDirectionState(saved.sortDirection);
    setShowExpiredOnlyState(saved.showExpiredOnly);
    setLastActiveTab(activeTab);
  }

  function setSortBy(v: string) {
    setSortByState(v);
    setFilterState(activeTab, { sortBy: v });
  }
  function setSortDirection(v: "asc" | "desc") {
    setSortDirectionState(v);
    setFilterState(activeTab, { sortDirection: v });
  }
  function setShowExpiredOnly(v: boolean) {
    setShowExpiredOnlyState(v);
    setFilterState(activeTab, { showExpiredOnly: v });
  }

  return {
    sortBy,
    sortDirection,
    showExpiredOnly,
    setSortBy,
    setSortDirection,
    setShowExpiredOnly,
  };
}
