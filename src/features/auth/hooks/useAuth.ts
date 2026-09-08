import { getAccessToken, isAccessTokenExpired } from "@/shared/lib/authToken";

interface UseAuthResult {
  isAuthenticated: boolean;
  isLoading: boolean;
}

// 개발용 임시 우회 스위치. 로컬 .env(커밋되지 않음)에
// VITE_DEV_BYPASS_AUTH=true 를 넣으면 로그인 없이도 보호된 화면에 진입할 수 있음.
// import.meta.env.DEV 조건 덕분에 프로덕션 빌드에는 절대 포함되지 않음.
const DEV_BYPASS_AUTH =
  import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === "true";

// 토큰이 "저장돼 있는지"뿐 아니라 JWT의 exp 클레임으로 "이미 만료됐는지"까지
// 확인함(authToken.ts의 isAccessTokenExpired 참고) — 네트워크 요청 없이 즉시
// 판단 가능해서 화면이 그려지기 전에 바로 반영됨. 다만 서명 검증은 안 하므로
// "서버가 이 특정 토큰을 강제로 무효화(로그아웃 처리 등)"한 경우까지는 못
// 잡음 — 그건 여전히 실제 API 호출 후 401을 받아야 알 수 있고, axiosClient.ts의
// 응답 인터셉터가 그 사후 처리를 맡음. 즉 이 둘은 서로 대체가 아니라 상호보완:
// 여기서는 "당연히 만료된 것"을 화면이 뜨기도 전에 미리 거르고, 그 외의
// 서버 쪽 무효화는 axiosClient가 처리함.
export function useAuth(): UseAuthResult {
  if (DEV_BYPASS_AUTH) {
    return { isAuthenticated: true, isLoading: false };
  }

  const token = getAccessToken();

  return {
    isAuthenticated: token !== null && !isAccessTokenExpired(token),
    isLoading: false,
  };
}
