import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { withdrawUser } from "@/features/auth/api/authApi";
import { clearAccessToken } from "@/shared/lib/authToken";

// /mytickets, /mycampaigns 두 라우트가 공유하는 레이아웃.
// 탭 상태를 컴포넌트 state가 아니라 URL로 관리하기 때문에,
// 캠페인 상세 화면으로 이동했다가 뒤로가기를 눌러도 있던 탭 그대로 돌아옵니다.
export function DashboardLayout() {
  const logout = useLogout();
  const navigate = useNavigate();

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
        <TabLink to="/mytickets" label="나의 티켓" />
        <TabLink to="/mycampaigns" label="내가 만든 행사" />

        <button
          type="button"
          onClick={() => navigate("/campaigns/create")}
          className="ml-auto mb-2 rounded-full px-4 py-2 text-sm font-semibold text-(--on-yellow) transition-transform hover:scale-[1.03] active:scale-[0.97]"
          style={{ backgroundColor: "var(--brand-yellow)" }}
        >
          + 행사 만들기
        </button>
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
