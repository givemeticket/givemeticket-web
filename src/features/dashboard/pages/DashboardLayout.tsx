import { NavLink, Outlet } from "react-router-dom";

// /mytickets, /mycampaigns 두 라우트가 공유하는 레이아웃.
// 탭 상태를 컴포넌트 state가 아니라 URL로 관리하기 때문에,
// 캠페인 상세 화면으로 이동했다가 뒤로가기를 눌러도 있던 탭 그대로 돌아옵니다.
export function DashboardLayout() {
  const tabLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 text-sm font-medium border-b-2 ${
      isActive ? "border-black text-black" : "border-transparent text-gray-400"
    }`;

  return (
    <div>
      <nav className="flex border-b">
        <NavLink to="/mytickets" className={tabLinkClass}>
          나의 티켓
        </NavLink>
        <NavLink to="/mycampaigns" className={tabLinkClass}>
          내가 만든 행사
        </NavLink>
      </nav>

      <div className="p-4">
        <Outlet />
      </div>
    </div>
  );
}
