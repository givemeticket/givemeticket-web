import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { withdrawUser } from "@/features/auth/api/authApi";
import { clearAccessToken } from "@/shared/lib/authToken";
import { FilterDropdown } from "@/shared/components/FilterDropdown";
import {
  getFilterState,
  setFilterState,
  type FilterTab,
} from "../lib/dashboardFilterStore";

const SORT_OPTIONS_BY_TAB: Record<
  FilterTab,
  { value: string; label: string }[]
> = {
  mytickets: [
    { value: "appliedAt", label: "신청 날짜" },
    { value: "openAt", label: "오픈 날짜" },
  ],
  mycampaigns: [
    { value: "createdAt", label: "만든 날짜" },
    { value: "openAt", label: "오픈 날짜" },
  ],
};

/** 탭(MyTicketsTab, MyCampaignsTab)이 useOutletContext로 받아가는 값 */
export interface DashboardOutletContext {
  sortBy: string;
  sortDirection: "asc" | "desc";
  showDeleted: boolean;
}

// /mytickets, /mycampaigns 두 라우트가 공유하는 레이아웃.
// 정렬/삭제표시 필터를 탭 바로 옆(같은 줄)에 두려면 이 상태를 탭 컴포넌트가 아니라
// 여기서 관리해야 해서, 탭에는 Outlet context로 필요한 값만 내려줌.
export function DashboardLayout() {
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab: FilterTab = location.pathname.startsWith("/mycampaigns")
    ? "mycampaigns"
    : "mytickets";

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

  // TODO: 테스트용 임시 버튼. 실제 회원탈퇴 플로우(확인 모달 디자인, 탈퇴 사유 등)는
  // 나중에 제대로 화면으로 뺄 예정. 지금은 API 동작 확인용.
  async function handleWithdraw() {
    if (!confirm("정말 탈퇴하시겠어요? 되돌릴 수 없어요.")) return;

    try {
      await withdrawUser();
      clearAccessToken();
      navigate("/", { replace: true });
    } catch {
      alert("탈퇴 중 문제가 발생했어요.");
    }
  }

  const outletContext: DashboardOutletContext = {
    sortBy,
    sortDirection,
    showDeleted,
  };

  return (
    <div className="min-h-screen bg-(--ink) text-(--paper)">
      <header className="mx-auto flex max-w-2xl items-center gap-2 px-6 pt-8">
        <img src="/favicon-transparent-512.png" alt="" className="h-7 w-7" />
        <span className="text-xs font-semibold tracking-[0.25em] text-(--muted)">
          GIVEMETICKET
        </span>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={handleWithdraw}
            className="text-xs font-medium text-(--muted) hover:text-(--warn)"
          >
            회원탈퇴
          </button>
          <button
            type="button"
            onClick={logout}
            className="text-xs font-medium text-(--muted) hover:text-(--paper)"
          >
            로그아웃
          </button>
        </div>
      </header>

      <nav className="mx-auto mt-8 flex max-w-2xl items-center gap-6 px-6">
        <div className="relative flex w-36">
          <TabLink to="/mytickets" label="나의 티켓" />
          <TabLink to="/mycampaigns" label="나의 행사" />
        </div>

        <div className="ml-auto mb-2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate("/campaigns/create")}
            aria-label="행사 만들기"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-(--ink-soft)"
            style={{ color: "var(--muted)" }}
          >
            <PlusIcon />
          </button>

          <FilterDropdown
            sortOptions={SORT_OPTIONS_BY_TAB[activeTab]}
            sortValue={sortBy}
            onSortChange={setSortBy}
            sortDirection={sortDirection}
            onSortDirectionChange={setSortDirection}
            showDeleted={showDeleted}
            onShowDeletedChange={setShowDeleted}
          />
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 pb-10 pt-4">
        <Outlet context={outletContext} />
      </main>
    </div>
  );
}

function TabLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex-1 pb-3 text-center text-sm font-medium transition-colors ${
          isActive ? "text-(--paper)" : "text-(--muted) hover:text-(--paper)/80"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {label}
          {isActive && (
            <span
              className="absolute inset-x-0 -bottom-px h-0.5 rounded-full"
              style={{ backgroundColor: "var(--brand-blue)" }}
            />
          )}
        </>
      )}
    </NavLink>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
