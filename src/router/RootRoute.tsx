import { useLayoutEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { beginPageTransition } from "@/shared/animation/pageTransition/pageTransitionStore";
import { LoadingScreen } from "@/shared/components/LoadingScreen";
import { clearAllScrollPositions } from "@/shared/animation/pageTransition/scrollPositionStore";
import { clearPendingScrollOffset } from "@/shared/animation/pageTransition/scrollOffsetStore";
import { clearLeftToNonCardPage } from "@/shared/animation/pageTransition/leftToNonCardPageStore";
import { clearReturningCampaign } from "@/shared/animation/pageTransition/returningCardStore";

// "/" 는 고정된 라우트가 아니라, 로그인 상태에 따라
// 로그인 화면(비로그인) 또는 대시보드 기본 탭(로그인)으로 갈리는 진입점.
export function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // "/"는 UserAppShell 트리 바깥의 별개 라우트라서, 여기로 왔다가 /mytickets로
  // 되돌아가는 왕복 전체가 RootLayout(전환 감지를 담당하는 곳)의 눈에 안 띔.
  // "/"로 오는 진입점은(홈 버튼이든, 나중에 늘어날 다른 경로든) 결국 다 여기를
  // 거치니까, 각 진입점마다 챙기는 대신 여기 한 곳에서만 처리함.
  //
  // 렌더링 도중(return 직전)에 직접 호출하면 안 됨 — beginPageTransition() 내부에서
  // 다른 컴포넌트(UserAppShell)가 구독 중인 상태를 바꾸는데, 리액트가 "렌더링 중에
  // 다른 컴포넌트의 상태를 바꾸는 것"을 금지해서 경고가 뜸("Cannot update a
  // component while rendering a different component"). useLayoutEffect로 옮겨서
  // 커밋 이후에 실행되게 함.
  useLayoutEffect(() => {
    if (!isAuthenticated) return;
    beginPageTransition();
    // 홈으로 이동하면, 지금까지 쌓여있던 애니메이션 관련 상태를 전부 깨끗하게
    // 정리함 — 아무 데도 안 쓰이고 남아있던 낡은 값들이 나중에 엉뚱한 시점에
    // 잘못 소비되면서 애니메이션에 가끔 부작용을 일으키는 문제가 있었음. "/"로
    // 오는 진입점이 결국 다 여기를 거치니, 홈으로 갈 때마다 자연스럽게 리셋되는
    // 셈. 단, dashboardFilterStore.ts는 일부러 안 건드림 — 애니메이션이랑 무관한
    // 사용자 선호(정렬/필터)라, 홈으로 갈 때마다 초기화되면 오히려 불편함.
    clearAllScrollPositions();
    clearPendingScrollOffset();
    clearLeftToNonCardPage();
    clearReturningCampaign();
  }, [isAuthenticated]);

  if (isLoading) return <LoadingScreen />;

  if (isAuthenticated) {
    return <Navigate to="/mytickets" replace />;
  }

  return <LoginPage />;
}
