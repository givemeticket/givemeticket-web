import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { beginPageTransition } from "@/shared/lib/pageTransitionStore";

// "/" 는 고정된 라우트가 아니라, 로그인 상태에 따라
// 로그인 화면(비로그인) 또는 대시보드 기본 탭(로그인)으로 갈리는 진입점.
export function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // TODO: 로딩 스피너로 교체

  if (isAuthenticated) {
    // "/"는 UserAppShell 트리 바깥의 별개 라우트라서, 여기로 왔다가 /mytickets로
    // 되돌아가는 왕복 전체가 RootLayout(전환 감지를 담당하는 곳)의 눈에 안 띔.
    // "/"로 오는 진입점은(홈 버튼이든, 나중에 늘어날 다른 경로든) 결국 다 여기를
    // 거치니까, 각 진입점마다 챙기는 대신 여기 한 곳에서만 처리함.
    beginPageTransition();
    return <Navigate to="/mytickets" replace />;
  }

  return <LoginPage />;
}
