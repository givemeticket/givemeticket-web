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
import { UserAppShell } from "./UserAppShell";
import { DashboardLayout } from "@/features/dashboard/pages/DashboardLayout";
import { MyTicketsTab } from "@/features/dashboard/components/MyTicketsTab";
import { MyCampaignsTab } from "@/features/dashboard/components/MyCampaignsTab";
import { CampaignCreatePage } from "@/features/campaign/pages/CampaignCreatePage";
import { CampaignEditPage } from "@/features/campaign/pages/CampaignEditPage";
import { CampaignApplicantsPage } from "@/features/campaign/pages/CampaignApplicantsPage";
import { CampaignDetailPage } from "@/features/campaign/pages/CampaignDetailPage";
import { OAuthCallbackPage } from "@/features/auth/pages/OAuthCallbackPage";
import { FullPageMessage } from "@/shared/components/FullPageMessage";
import { MapPinOff } from "lucide-react";
import { beginPageTransition } from "@/shared/lib/pageTransitionStore";
import { consumePendingScrollOffsetForRootLayout } from "@/shared/lib/scrollOffsetStore";
import {
  saveScrollPosition as saveScrollPositionRaw,
  getScrollPosition,
} from "@/shared/lib/scrollPositionStore";
import { POST_ANIMATION_DELAY_MS } from "@/shared/lib/animationDurations";

// 스크롤 복원이 의미 없는 경로(수정/신청자 목록)는 저장 자체를 건너뜀. 이 두
// 화면은 짧은 폼/목록이라 스크롤 복원할 가치가 딱히 없는데, `shortCode`가 경로에
// 들어가다 보니 방문한 캠페인 수만큼 sessionStorage에 안 쓰이는 키가 계속 쌓이는
// 낭비가 있었음. 반대로 캠페인 상세(`/campaigns/{shortCode}`)나 행사 추가
// (`/campaigns/create`)는 목록↔이동 왕복에서 실제로 쓰이니 그대로 유지함 — 상세도
// shortCode가 들어가 똑같이 계속 쌓이긴 하지만, 이건 "목록↔상세" 스크롤 복원에
// 실제로 필요한 저장이라 감수함.
function isScrollWorthSaving(pathname: string): boolean {
  return !pathname.endsWith("/edit") && !pathname.endsWith("/applicants");
}

function saveScrollPosition(pathname: string) {
  if (!isScrollWorthSaving(pathname)) return;
  saveScrollPositionRaw(pathname);
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

// UserAppShell 밑에서 페이지 전환을 담당하는 레이아웃. 스크롤 저장/복원은 페이지가
// 바뀔 때마다 사라지고 새로 생기면 안 되고(그러면 "떠나는 순간 저장"이 제대로 안 됨),
// 이 레이아웃 밑 라우트들이 켜져있는 내내 딱 하나만 존재해야 해서 여기에 딱 한 번만 둠.
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
  // 단, 카드 클릭/뒤로가기로 인한 목록↔상세 전환은 예외 — 그 경우엔 스크롤 오프셋
  // 방식(scrollOffsetStore.ts)이 대신 처리하니, 여기서 평소처럼 스크롤을 옮기면
  // 오히려 방해가 됨. hasPendingScrollOffset()으로 그 경우를 감지해서 건너뜀.
  useLayoutEffect(() => {
    const leavingPathname = prevPathnameRef.current;
    const arrivingPathname = location.pathname;
    prevPathnameRef.current = arrivingPathname;

    if (leavingPathname === arrivingPathname) return;

    // 헤더(로고/아바타)처럼 특정 페이지에 속하지 않는 요소도 전환 중엔 클릭이
    // 막혀야 해서, 여기(진짜 전환이 감지되는 지점)에서 전역 신호를 켬(자동으로 꺼짐
    // — pageTransitionStore.ts 참고).
    beginPageTransition();

    // 떠나는 페이지의 스크롤 위치를 저장 — 아직 화면이 안 바뀐 시점이라 window.scrollY가
    // 정확히 그 페이지 기준 값임
    saveScrollPosition(leavingPathname);

    // 스크롤 오프셋 방식으로 처리되는 전환이면, 도착 페이지가 알아서 스크롤까지
    // 책임지고 처리하니 여기서는 아무것도 안 함
    if (consumePendingScrollOffsetForRootLayout()) return;

    const timer = setTimeout(() => {
      // 도착한 페이지에 저장된 값이 있으면 그 위치로, 처음 오는 페이지면 맨 위로
      window.scrollTo(0, getScrollPosition(arrivingPathname));
    }, POST_ANIMATION_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [location.pathname]);

  return (
    <LayoutGroup>
      {/* initial={false}를 뺐음 — 이 prop이 "AnimatePresence가 맨 처음 마운트될 때
          이미 있던 자식엔 진입 애니메이션 재생 안 함"이라는 뜻인데, 그 억제 효과가
          하위의 다른 motion 요소들(카드, 필터 줄 등)한테까지 새어나가서, 새로고침
          직후 "진짜 페이지 전환(다른 키로의 전환)을 한 번도 안 겪은 상태"인 동안엔
          탭을 아무리 전환해도 카드 진입 애니메이션이 아예 시작을 안 하는 버그가
          있었음(로그로 확인함). 상세 페이지 등 진짜 전환을 한 번 거치면 그 이후론
          정상 작동해서, "새로고침 직후 vs 아닌 경우"로 동작이 갈리는 비일관성이 있었음.
          제거하면 최초 페이지 로드 때도 살짝 페이드인되는 정도의 트레이드오프만 생김. */}
      <AnimatePresence mode="popLayout">
        {element && (
          <div key={animationKey} className="h-full">
            {element}
          </div>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}

function NotFoundPage() {
  return (
    <FullPageMessage
      icon={<MapPinOff size={32} strokeWidth={1.6} />}
      title="페이지를 찾을 수 없어요"
      description="주소가 잘못됐거나, 더 이상 존재하지 않는 페이지예요."
    />
  );
}

const router = createBrowserRouter([
  // 로그인 화면(비로그인 시 "/") / OAuth 콜백은 UserAppShell(고정 헤더) 바깥에 둠 —
  // 이 두 화면엔 로고+아바타 헤더가 뜨면 안 되므로.
  { path: "/", element: <RootRoute /> },
  { path: "/oauth/:provider", element: <OAuthCallbackPage /> },

  {
    // 로고+아바타 고정 헤더. 리액트 라우터 중첩 레이아웃이라, 아래 자식 라우트가
    // 아무리 바뀌어도 이 컴포넌트 자체는 리마운트 안 됨 — 그래서 헤더가 페이지 전환
    // 애니메이션의 영향을 전혀 안 받고 항상 고정으로 보임.
    element: <UserAppShell />,
    children: [
      {
        element: <RootLayout />,
        children: [
          // 비로그인도 접근 가능한 라우트
          { path: "/campaigns/:shortCode", element: <CampaignDetailPage /> },

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
              {
                path: "/campaigns/:shortCode/edit",
                element: <CampaignEditPage />,
              },
              {
                path: "/campaigns/:shortCode/applicants",
                element: <CampaignApplicantsPage />,
              },
            ],
          },

          { path: "*", element: <NotFoundPage /> },
        ],
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
