import { NavLink, Outlet } from "react-router-dom";
import { motion } from "motion/react";

// /mytickets, /mycampaigns 두 라우트가 공유하는 레이아웃 — 탭만 담당.
// 헤더(로고+아바타)는 이제 UserAppShell이 전역으로 고정 처리함 (여기서 빠짐).
// 정렬/삭제표시 필터와 행사추가 버튼은 CampaignListTab이 각자 직접 관리함.
export function DashboardLayout() {
  return (
    <div className="relative flow-root min-h-screen text-(--paper)">
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

      {/* 상세 페이지로 이동할 땐 이 탭이 사라지는 화면이라, "나머지 요소" 페이드
          대상에 포함시킴. main(카드가 들어있는 곳)은 감싸지 않음 — 카드는 형제
          컴포넌트로 독립적인 이동 애니메이션을 가져야 해서. */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
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
