import { NavLink, Outlet } from "react-router-dom";
import { useLogout } from "@/features/auth/hooks/useLogout";

// /mytickets, /mycampaigns 두 라우트가 공유하는 레이아웃.
// 탭 상태를 컴포넌트 state가 아니라 URL로 관리하기 때문에,
// 캠페인 상세 화면으로 이동했다가 뒤로가기를 눌러도 있던 탭 그대로 돌아옵니다.
export function DashboardLayout() {
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-(--ink) text-(--paper)">
      <header className="mx-auto flex max-w-2xl items-center gap-2 px-6 pt-8">
        <img src="/favicon-transparent-512.png" alt="" className="h-7 w-7" />
        <span className="text-xs font-semibold tracking-[0.25em] text-(--muted)">
          GIVEMETICKET
        </span>

        <button
          type="button"
          onClick={logout}
          className="ml-auto text-xs font-medium text-(--muted) hover:text-(--paper)"
        >
          로그아웃
        </button>
      </header>

      <nav
        className="mx-auto mt-8 flex max-w-2xl gap-6 border-b px-6"
        style={{ borderColor: "var(--line)" }}
      >
        <TabLink to="/mytickets" label="나의 티켓" />
        <TabLink to="/mycampaigns" label="내가 만든 행사" />
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}

function TabLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative pb-3 text-sm font-medium transition-colors ${
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
              style={{ backgroundColor: "var(--brand-yellow)" }}
            />
          )}
        </>
      )}
    </NavLink>
  );
}
