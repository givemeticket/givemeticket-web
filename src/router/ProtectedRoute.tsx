import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoadingScreen } from "@/shared/components/LoadingScreen";

// 이 라우트 하위는 로그인이 필요합니다.
// 비로그인 상태로 접근 시, 원래 가려던 경로를 redirect 쿼리파라미터에 담아
// "/" (로그인 화면)로 보냅니다. 로그인 성공 후 LoginPage에서 이 값을 읽어
// 원래 목적지로 되돌려보내면 됩니다.
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated) {
    const redirectTo = `${location.pathname}${location.search}`;
    return (
      <Navigate to={`/?redirect=${encodeURIComponent(redirectTo)}`} replace />
    );
  }

  return <Outlet />;
}
