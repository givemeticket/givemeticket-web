import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoadingScreen } from "@/shared/components/feedback/LoadingScreen";

// 로그인 전용 화면 placeholder. UserAppShell 트리 바깥(헤더 없음, LandingPage/
// OAuthCallbackPage와 같은 자리)에서 씀(UserApp.tsx 참고). 실제 카카오/네이버
// 로그인 버튼 로직은 지금 당장은 여전히 LandingPage.tsx(= "/") 쪽에 있음 —
// 이 화면이 그 역할을 넘겨받는 건 나중 작업.
//
// 이미 로그인한 사용자는 이 화면에 있을 이유가 없어서(로그인할 게 없음)
// "/"로 돌려보냄 — ProtectedRoute가 "로그인 안 했으면 쫓아냄"이라면 이건
// 그 반대(로그인 했으면 쫓아냄). 페이지 하나짜리라 별도 라우트 가드
// 컴포넌트로 안 빼고 이 컴포넌트 안에서 직접 처리함 — 게스트 전용 화면이
// 더 늘어나면 그때 ProtectedRoute처럼 공용 컴포넌트로 뽑을 것.
export function SignInPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-(--ink) text-(--paper)">
      <p className="text-2xl font-bold">로그인 화면</p>
    </div>
  );
}
