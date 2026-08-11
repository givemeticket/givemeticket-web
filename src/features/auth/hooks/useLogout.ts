import { useNavigate } from "react-router-dom";
import { clearAccessToken } from "@/shared/lib/authToken";

// 로그아웃 로직을 훅으로 분리 — 대시보드 헤더뿐 아니라
// 나중에 설정 화면 등 다른 곳에서도 재사용하기 쉽게.
export function useLogout() {
  const navigate = useNavigate();

  return function logout() {
    clearAccessToken();
    navigate("/", { replace: true });
  };
}
