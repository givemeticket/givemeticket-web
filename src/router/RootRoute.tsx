import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoginPage } from "@/features/auth/pages/LoginPage";

// "/" 는 고정된 라우트가 아니라, 로그인 상태에 따라
// 로그인 화면(비로그인) 또는 대시보드 기본 탭(로그인)으로 갈리는 진입점.
export function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // TODO: 로딩 스피너로 교체

  if (isAuthenticated) {
    return <Navigate to="/mytickets" replace />;
  }

  return <LoginPage />;
}
