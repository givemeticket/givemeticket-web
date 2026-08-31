// 정렬 기준/삭제 표시 여부를 탭별로 기억해두는 모듈 메모리 저장소.
// useState가 아니라 여기 두는 이유: 상세 페이지 갔다가 돌아오면 탭 컴포넌트가
// 통째로 언마운트→마운트되면서 useState 값은 초기화되는데, 이 값들은
// 그와 무관하게 계속 살아있어야 해서 (새로고침하면 초기화되는 건 자연스러운 동작으로 봄).
//
// 단, "다른 탭으로 전환"할 땐 오히려 초기화돼야 함 — 상세 화면 왕복이랑 다르게,
// 탭을 바꾸는 건 완전히 다른 목록을 보러 가는 거라 이전 탭의 정렬 상태가 남아있으면
// 어색함. 이 구분은 DashboardLayout.tsx의 TabLink가 판단해서(클릭 시 navigate()
// 직전에 동기적으로) resetFilterState를 호출함.

export type FilterTab = "mytickets" | "mycampaigns";

export interface FilterState {
  sortBy: string;
  sortDirection: "asc" | "desc";
  /** true면 만료(삭제됨/종료됨)된 행사만, false면 그 반대(만료 안 된 것만) */
  showExpiredOnly: boolean;
}

const DEFAULT_FILTER_STATE: Record<FilterTab, FilterState> = {
  mytickets: {
    sortBy: "appliedAt",
    sortDirection: "desc",
    showExpiredOnly: false,
  },
  mycampaigns: {
    sortBy: "createdAt",
    sortDirection: "desc",
    showExpiredOnly: false,
  },
};

const store: Record<FilterTab, FilterState> = {
  mytickets: { ...DEFAULT_FILTER_STATE.mytickets },
  mycampaigns: { ...DEFAULT_FILTER_STATE.mycampaigns },
};

export function getFilterState(tab: FilterTab): FilterState {
  return store[tab];
}

export function setFilterState(tab: FilterTab, next: Partial<FilterState>) {
  store[tab] = { ...store[tab], ...next };
}

/** 탭 전환 시 호출 — 그 탭의 정렬/필터 상태를 기본값으로 되돌림.
 * 상세 화면 왕복 시엔 호출하면 안 됨(그땐 값이 유지되는 게 맞음) */
export function resetFilterState(tab: FilterTab) {
  store[tab] = { ...DEFAULT_FILTER_STATE[tab] };
}
