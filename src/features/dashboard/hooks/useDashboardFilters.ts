import { useEffect, useState } from "react";
import {
  getFilterState,
  setFilterState,
  type FilterTab,
} from "../lib/dashboardFilterStore";

// activeTab이 바뀔 때마다 그 탭에 저장돼있던 정렬/삭제표시 값을 다시 불러오고,
// 값이 바뀌면 저장소에도 같이 반영하는 로직을 한데 모음. DashboardLayout이 이걸
// 직접 들고 있으면 "실제로 화면에 뭘 그리는지"가 이 동기화 코드에 묻혀서 안 보이길래 분리함.
export function useDashboardFilters(activeTab: FilterTab) {
  const [sortBy, setSortByState] = useState(
    () => getFilterState(activeTab).sortBy,
  );
  const [sortDirection, setSortDirectionState] = useState<"asc" | "desc">(
    () => getFilterState(activeTab).sortDirection,
  );
  const [showDeleted, setShowDeletedState] = useState(
    () => getFilterState(activeTab).showDeleted,
  );

  // 탭을 전환하면, 그 탭에 저장돼있던 값으로 다시 불러옴
  useEffect(() => {
    const saved = getFilterState(activeTab);
    setSortByState(saved.sortBy);
    setSortDirectionState(saved.sortDirection);
    setShowDeletedState(saved.showDeleted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function setSortBy(v: string) {
    setSortByState(v);
    setFilterState(activeTab, { sortBy: v });
  }
  function setSortDirection(v: "asc" | "desc") {
    setSortDirectionState(v);
    setFilterState(activeTab, { sortDirection: v });
  }
  function setShowDeleted(v: boolean) {
    setShowDeletedState(v);
    setFilterState(activeTab, { showDeleted: v });
  }

  return {
    sortBy,
    sortDirection,
    showDeleted,
    setSortBy,
    setSortDirection,
    setShowDeleted,
  };
}
