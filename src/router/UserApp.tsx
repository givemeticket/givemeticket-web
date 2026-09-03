import { useLayoutEffect, useRef, useState } from "react";
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
import { beginPageTransition } from "@/shared/animation/pageTransition/pageTransitionStore";
import {
  consumePendingScrollOffsetForRootLayout,
  markPendingScrollOffset,
} from "@/shared/animation/pageTransition/scrollOffsetStore";
import { getScrollPosition } from "@/shared/animation/pageTransition/scrollPositionStore";
import {
  saveScrollPosition,
  supportsScrollOffsetTrick,
  getAnimationKey,
} from "@/shared/animation/pageTransition/routeTransitionRules";
import { POST_ANIMATION_DELAY_MS } from "@/shared/animation/animationDurations";

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

  // 스크롤 오프셋 표시는 자식(도착 페이지)이 렌더링을 시작하기 전에 끝나 있어야
  // 함 — 도착 페이지(CampaignListTab/CampaignDetailPage)는 이 값을 useState
  // 초기화 함수(=렌더링 도중 실행됨)에서 바로 읽어가는데, 아래 useLayoutEffect는
  // 전체 트리가 커밋된 뒤(자식 렌더링보다 한참 뒤)에나 실행돼서 거기서 표시하면
  // 이미 늦음 — 자식은 그 시점엔 이미 (관련 없는 이전 전환에서 남은) 낡은 값을
  // 읽어버린 뒤라서, 정작 이번 전환을 위해 계산한 값은 아무도 못 읽고 버려짐
  // (실제로 이렇게 했다가, 카드는 낡은/어긋난 오프셋 기준으로 layoutId 위치를
  // 잡고 정렬 버튼 같은 일반 요소는 다른 기준으로 그려지면서 서로 어긋나
  // 빈 공간이 보이는 버그로 이어졌음). 그래서 이 값만 따로 렌더링
  // 도중(자식을 그리기 전)에 미리 계산해서 표시해둠.
  //
  // ref가 아니라 state로 "직전에 처리한 경로"를 추적함 — ref를 렌더링 중에
  // 읽거나 쓰면 안 된다는 규칙(react-hooks/refs, `npm run lint`가 잡아냄)에
  // 걸려서. 대신 리액트가 공식적으로 권장하는 "렌더링 중 state를 비교해서
  // 다르면 그 자리에서 다시 set"하는 패턴을 씀 — 렌더링 도중 setState를 부르면
  // 리액트가 자식을 그리기 전에 이 컴포넌트를 즉시 한 번 더 렌더링해주기 때문에
  // (그 사이 커밋/페인트는 안 일어남), 자식은 항상 갱신된 값만 보게 됨.
  const [scrollOffsetMarkedForPathname, setScrollOffsetMarkedForPathname] =
    useState(location.pathname);
  if (location.pathname !== scrollOffsetMarkedForPathname) {
    if (
      supportsScrollOffsetTrick(
        scrollOffsetMarkedForPathname,
        location.pathname,
      )
    ) {
      markPendingScrollOffset(
        window.scrollY - getScrollPosition(location.pathname),
      );
    }
    setScrollOffsetMarkedForPathname(location.pathname);
  }

  // 스크롤 저장은 떠나는 순간 바로, 복원은 애니메이션이 끝나는 시점에 딱 한 번만
  // (window.scrollTo 한 번) 실행함.
  //
  // 단, 카드 클릭/뒤로가기로 인한 목록↔상세 전환은 예외 — 그 경우엔 스크롤 오프셋
  // 방식(scrollOffsetStore.ts, 위에서 표시함)이 대신 처리하니, 여기서 평소처럼
  // 스크롤을 옮기면 오히려 방해가 됨. consumePendingScrollOffsetForRootLayout()으로
  // 그 경우를 감지해서 건너뜀.
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

    // 스크롤 오프셋 방식으로 처리되는 전환이면(위에서 렌더링 중에 이미 표시해둠),
    // 도착 페이지가 알아서 스크롤까지 책임지고 처리하니 여기서는 아무것도 안 함
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
