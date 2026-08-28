import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { UserMenu } from "@/features/auth/components/UserMenu";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { useMe } from "@/features/auth/hooks/useMe";
import { withdrawUser } from "@/features/auth/api/authApi";
import { clearAccessToken } from "@/shared/lib/authToken";

// /mytickets, /mycampaigns 두 라우트가 공유하는 레이아웃 — 헤더+탭만 담당.
// 정렬/삭제표시 필터와 행사추가 버튼은 CampaignListTab이 각자 직접 관리함
// (예전엔 탭 전환 시 안 흔들리게 하려고 여기 뒀었는데, 탭 전환 자체가 이미
// 애니메이션 없이 순간적으로 바뀌게 되어있어서 그 우려가 실익이 없었음).
export function DashboardLayout() {
  const logout = useLogout();
  const navigate = useNavigate();

  const { data: me } = useMe();

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
    <div className="relative min-h-screen text-(--paper)">
      {/* 배경색 전용 레이어. 독립적으로 페이드시켜야 함 — 안 그러면 이 화면이 사라지는
          동안에도 불투명한 배경이 화면을 계속 덮어서, 그 밑에서 나타나는 상세 페이지가
          거의 끝까지 안 보이다가 마지막 순간에 갑자기 드러나는 문제가 생김. */}
      <motion.div
        className="absolute inset-0 -z-10 bg-(--ink)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />

      {/* 상세 페이지로 이동할 땐 이 레이아웃 전체(헤더/탭)가 사라지는 화면이라,
          "나머지 요소" 페이드 대상에 포함시킴. main(카드가 들어있는 곳)은 감싸지 않음 —
          카드는 형제 컴포넌트로 독립적인 이동 애니메이션을 가져야 해서. */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <header className="mx-auto flex max-w-2xl items-center gap-2 px-6 pt-8">
          <img src="/favicon-transparent-512.png" alt="" className="h-7 w-7" />
          <span className="text-xs font-semibold tracking-[0.25em] text-(--muted)">
            GIVEMETICKET
          </span>

          <div className="ml-auto flex items-center">
            {me && (
              <UserMenu
                nickname={me.nickname}
                profileImageUrl={me.profileImageUrl}
                onLogout={logout}
                onWithdraw={handleWithdraw}
              />
            )}
          </div>
        </header>

        <nav className="mx-auto mt-8 flex max-w-2xl px-6">
          <div className="relative flex w-36">
            <TabLink to="/mytickets" label="나의 티켓" />
            <TabLink to="/mycampaigns" label="나의 행사" />
          </div>
        </nav>
      </motion.div>

      <main className="mx-auto max-w-2xl px-6 pb-10 pt-4">
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
        `relative flex-1 pb-2.5 text-center text-sm font-medium transition-colors ${
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
