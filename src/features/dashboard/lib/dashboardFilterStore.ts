// 정렬 기준/삭제 표시 여부를 탭별로 기억해두는 모듈 메모리 저장소.
// useState가 아니라 여기 두는 이유: 상세 페이지 갔다가 돌아오면 탭 컴포넌트가
// 통째로 언마운트→마운트되면서 useState 값은 초기화되는데, 이 값들은
// 그와 무관하게 계속 살아있어야 해서 (새로고침하면 초기화되는 건 자연스러운 동작으로 봄).

export type FilterTab = "mytickets" | "mycampaigns";

export interface FilterState {
  sortBy: string;
  sortDirection: "asc" | "desc";
  showDeleted: boolean;
}

const store: Record<FilterTab, FilterState> = {
  mytickets: { sortBy: "appliedAt", sortDirection: "desc", showDeleted: false },
  mycampaigns: {
    sortBy: "createdAt",
    sortDirection: "desc",
    showDeleted: false,
  },
};

export function getFilterState(tab: FilterTab): FilterState {
  return store[tab];
}

export function setFilterState(tab: FilterTab, next: Partial<FilterState>) {
  store[tab] = { ...store[tab], ...next };
}
