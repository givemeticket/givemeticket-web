import { useLayoutEffect, useRef } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  useLocation,
  useOutlet,
} from "react-router-dom";
import { AnimatePresence, LayoutGroup } from "motion/react";
import { RootRoute } from "./RootRoute";
import { ProtectedRoute } from "./ProtectedRoute";
import { DashboardLayout } from "@/features/dashboard/pages/DashboardLayout";
import { MyTicketsTab } from "@/features/dashboard/components/MyTicketsTab";
import { MyCampaignsTab } from "@/features/dashboard/components/MyCampaignsTab";
import { CampaignCreatePage } from "@/features/campaign/pages/CampaignCreatePage";
import { CampaignEditPage } from "@/features/campaign/pages/CampaignEditPage";
import { CampaignDetailPage } from "@/features/campaign/pages/CampaignDetailPage";
import { OAuthCallbackPage } from "@/features/auth/pages/OAuthCallbackPage";

// 경로별 스크롤 위치를 직접 관리 (sessionStorage — 새로고침해도 유지되면 좋아서).
// 리액트 라우터의 <ScrollRestoration> 대신 직접 저장/복원함 — 페이지 전환
// 애니메이션 중엔 목록/상세 두 화면이 동시에 떠 있는데, 그동안 스크롤이 언제 어디로
// 옮겨지는지를 저희가 정확한 타이밍에 직접 통제해야 해서.
const SCROLL_KEY_PREFIX = "gmt_scroll:";

function saveScrollPosition(pathname: string) {
  sessionStorage.setItem(SCROLL_KEY_PREFIX + pathname, String(window.scrollY));
}

function getScrollPosition(pathname: string): number {
  const raw = sessionStorage.getItem(SCROLL_KEY_PREFIX + pathname);
  return raw ? Number(raw) : 0;
}

// /mytickets, /mycampaigns는 같은 DashboardLayout 안에서 탭 내용만 바뀌는 거라
// 페이지 전환 애니메이션이 필요 없음 — 둘을 같은 키("dashboard")로 묶어서,
// 이 둘 사이 이동에서는 AnimatePresence가 키 변화를 감지 못하게(=애니메이션 안 걸리게) 함.
// 그 외(상세/생성/체크아웃 등) 진짜 다른 페이지로 넘어갈 때만 실제로 키가 바뀌어서 애니메이션이 걸림.
function getAnimationKey(pathname: string): string {
  if (pathname === "/mytickets" || pathname === "/mycampaigns")
    return "dashboard";
  return pathname;
}

// 앱 전체를 감싸는 루트 레이아웃. 스크롤 저장/복원은 페이지가 바뀔 때마다 사라지고
// 새로 생기면 안 되고(그러면 "떠나는 순간 저장"이 제대로 안 됨), 앱이 켜져있는 내내
// 딱 하나만 존재해야 해서 여기(모든 라우트의 공통 조상)에 딱 한 번만 둠.
//
// 여기서는 일부러 자체적인 페이드/이동 애니메이션을 걸지 않음 — 여기서 페이지 전체를
// 감싸서 애니메이션을 걸면, 그 안에 있는 "detail로 이어지는 카드"까지 투명도가 같이
// 낮아져 버림(부모가 흐려지면 자식도 시각적으로 같이 흐려질 수밖에 없어서). 그래서
// "나머지 요소만 페이드"는 각 페이지(DashboardLayout, CampaignDetailPage)가 카드를
// 형제 요소로 빼서 직접 처리하고, 여기서는 AnimatePresence가 페이지 전환 중 이전
// 화면을 계속 붙잡아두는 역할만 함 (각 페이지 안의 motion 컴포넌트들이 실제 애니메이션
// 지속시간을 만들어냄). LayoutGroup으로 감싸서 layoutId 매칭이 확실히 이뤄지게 함.
//
// mode="popLayout": 나가는 페이지를 문서 흐름에서 빼서(position: absolute) 애니메이션
// 재생 중임. 이게 없으면 나가는 페이지 + 들어오는 페이지가 잠깐 동시에 "일반 흐름"
// 안에 같이 존재해서 문서 높이가 그 순간만 거의 두 배로 늘어나 버리고, 그 상태에서
// 상세 페이지(와 그 안의 카드)가 훨씬 아래쪽 좌표에 그려졌다가, 이전 페이지가 사라지는
// 순간 문서 높이가 줄면서 카드가 갑자기 위로 튀어오르는 것처럼 보였음.
function RootLayout() {
  const location = useLocation();
  const element = useOutlet();
  const animationKey = getAnimationKey(location.pathname);
  // 직전 렌더의 경로를 기억해둠 — "떠나는 페이지"가 어디였는지 알아야
  // 그 페이지의 스크롤 위치를 저장할 수 있어서
  const prevPathnameRef = useRef(location.pathname);

  // 스크롤 저장은 떠나는 순간 바로, 복원은 애니메이션이 끝나는 시점에 딱 한 번만
  // (window.scrollTo 한 번) 실행함.
  //
  // 참고(알려진 한계): 목록이 많이 스크롤된 상태에서 카드를 클릭하면, 그 카드가
  // 상세 페이지로 이동하는 애니메이션이 살짝 부자연스러울 수 있음(위로 사라졌다
  // 나타나는 것처럼 보임). 원인은 전환 중 잠깐 목록/상세 두 화면이 동시에 떠 있는데,
  // 브라우저 스크롤 값은 문서 전체에 하나뿐이라 "목록은 스크롤 500, 상세는 스크롤 0"을
  // 동시에 만족시킬 방법이 없어서임(근본적으로 실제 브라우저 스크롤과 완전히 분리된
  // 가상 스크롤 시스템을 새로 만들어야 완전히 해결됨 — 지금은 그 정도까진 안 함).
  // 스크롤 안 내린 상태에서의 전환은 이 문제와 무관하게 정상 동작함.
  useLayoutEffect(() => {
    const leavingPathname = prevPathnameRef.current;
    const arrivingPathname = location.pathname;
    prevPathnameRef.current = arrivingPathname;

    if (leavingPathname === arrivingPathname) return;

    // 떠나는 페이지의 스크롤 위치를 저장 — 아직 화면이 안 바뀐 시점이라 window.scrollY가
    // 정확히 그 페이지 기준 값임
    saveScrollPosition(leavingPathname);

    const timer = setTimeout(() => {
      // 도착한 페이지에 저장된 값이 있으면 그 위치로, 처음 오는 페이지면 맨 위로
      window.scrollTo(0, getScrollPosition(arrivingPathname));
    }, 400);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <LayoutGroup>
      <AnimatePresence mode="popLayout" initial={false}>
        {element && <div key={animationKey}>{element}</div>}
      </AnimatePresence>
    </LayoutGroup>
  );
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // 비로그인도 접근 가능한 라우트
      { path: "/", element: <RootRoute /> },
      { path: "/campaigns/:shortCode", element: <CampaignDetailPage /> },
      { path: "/oauth/:provider", element: <OAuthCallbackPage /> },

      // 로그인 필요한 라우트
      {
        element: <ProtectedRoute />,
        children: [
          {
            // path 없는 레이아웃 라우트: URL에 세그먼트를 추가하지 않고
            // /mytickets, /mycampaigns 두 라우트에 탭 UI만 공유시킴
            element: <DashboardLayout />,
            children: [
              { path: "/mytickets", element: <MyTicketsTab /> },
              { path: "/mycampaigns", element: <MyCampaignsTab /> },
            ],
          },
          { path: "/campaigns/create", element: <CampaignCreatePage /> },
          { path: "/campaigns/:shortCode/edit", element: <CampaignEditPage /> },
        ],
      },

      {
        path: "*",
        element: <div className="p-8">페이지를 찾을 수 없어요</div>,
      },
    ],
  },
]);

// 어드민 도메인이랑 완전히 분리된, 일반 사용자 전용 앱. main.tsx가 호스트네임을 보고
// 이 파일 자체를 동적 import할지, AdminApp.tsx를 동적 import할지 결정함 — 그래서
// 여기 있는 모든 정적 import(페이지 컴포넌트들)는 어드민 방문자한테는 아예 안 실림.
export function UserApp() {
  return <RouterProvider router={router} />;
}
