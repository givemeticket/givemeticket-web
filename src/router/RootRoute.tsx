import { useLayoutEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LandingPage } from "@/features/auth/pages/LandingPage";
import { HomeTab } from "@/features/dashboard/components/HomeTab";
import { DashboardLayout } from "@/features/dashboard/pages/DashboardLayout";
import { LoadingScreen } from "@/shared/components/feedback/LoadingScreen";
import { clearAllScrollPositions } from "@/shared/animation/pageTransition/scrollPositionStore";
import { clearPendingScrollOffset } from "@/shared/animation/pageTransition/scrollOffsetStore";
import { clearLeftToNonCardPage } from "@/shared/animation/pageTransition/leftToNonCardPageStore";
import { clearReturningCampaign } from "@/shared/animation/pageTransition/returningCardStore";

// "/" 는 고정된 콘텐츠가 아니라, 로그인 상태에 따라 안내 화면(비로그인) 또는
// "홈" 탭(로그인)으로 갈리는 진입점. 예전엔 로그인 상태면 여기서 /mytickets로
// 즉시 리다이렉트해버려서 "/"에 실제 콘텐츠가 없었는데, 이제 "홈" 탭이 생겨서
// "/" 자체에 머무름. UserAppShell/RootLayout 트리 **안**의 정상 라우트라서
// (UserAppShell.tsx 참고 — "/" + 비로그인일 때만 그쪽에서 헤더를 숨김),
// 로그인 상태로 이 라우트에 머무르는 동안 다른 탭과 오가도 헤더가 리마운트되지
// 않음.
export function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // 렌더링 도중(return 직전)에 직접 호출하면 안 됨 — 아래 스토어 초기화가
  // 다른 컴포넌트가 구독 중인 상태를 바꿀 수 있는데, 리액트가 "렌더링 중에
  // 다른 컴포넌트의 상태를 바꾸는 것"을 금지해서 경고가 뜸("Cannot update a
  // component while rendering a different component"). useLayoutEffect로 옮겨서
  // 커밋 이후에 실행되게 함.
  useLayoutEffect(() => {
    if (!isAuthenticated) return;
    // 홈으로 이동하면, 지금까지 쌓여있던 애니메이션 관련 상태를 전부 깨끗하게
    // 정리함 — 아무 데도 안 쓰이고 남아있던 낡은 값들이 나중에 엉뚱한 시점에
    // 잘못 소비되면서 애니메이션에 가끔 부작용을 일으키는 문제가 있었음. "/"로
    // 오는 진입점이 결국 다 여기를 거치니, 홈으로 갈 때마다 자연스럽게 리셋되는
    // 셈. 단, dashboardFilterStore.ts는 일부러 안 건드림 — 애니메이션이랑 무관한
    // 사용자 선호(정렬/필터)라, 홈으로 갈 때마다 초기화되면 오히려 불편함.
    //
    // beginPageTransition()은 예전엔(이 라우트가 UserAppShell/RootLayout 트리
    // 바깥에 있었을 때) 여기서 직접 불러야 했음(docs/animation.md 13번 —
    // 트리 바깥 경로로 이동하면 RootLayout 자신의 전환 감지가 그 이동 자체를
    // 놓쳐버렸기 때문). "/"가 이제 트리 안의 정상 라우트가 되면서 RootLayout의
    // 일반적인 pathname 비교 로직이 "/"로의 이동도 그냥 잡아내므로, 여기서
    // 중복으로 부를 필요가 없어져서 뺐음 — 실제 화면에서 전환이 여전히
    // 정상인지 확인 필요(추론만으로 단정 안 함).
    clearAllScrollPositions();
    clearPendingScrollOffset();
    clearLeftToNonCardPage();
    clearReturningCampaign();
  }, [isAuthenticated]);

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <DashboardLayout>
      <HomeTab />
    </DashboardLayout>
  );
}
