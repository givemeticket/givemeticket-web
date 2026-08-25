import { useQuery } from "@tanstack/react-query";
import { getMe } from "../api/authApi";
import { useAuth } from "./useAuth";

/** 지금 로그인된 내 정보(닉네임/프로필사진). 로그인 안 한 상태에선 호출 안 함 */
export function useMe() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
