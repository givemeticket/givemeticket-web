import { getAccessToken } from "@/shared/lib/authToken";

interface UseAuthResult {
  isAuthenticated: boolean;
  isLoading: boolean;
}

// 개발용 임시 우회 스위치. 로컬 .env(커밋되지 않음)에
// VITE_DEV_BYPASS_AUTH=true 를 넣으면 로그인 없이도 보호된 화면에 진입할 수 있음.
// import.meta.env.DEV 조건 덕분에 프로덕션 빌드에는 절대 포함되지 않음.
const DEV_BYPASS_AUTH =
  import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === "true";

// TODO: 지금은 "토큰이 저장돼 있는지"만 확인함 (만료/위조 여부는 검사 안 함).
// 백엔드에 "내 정보 조회" 같은 인증 확인용 API가 생기면, react-query로 그 API를
// 호출해서 성공 여부로 판단하는 방식으로 교체하는 게 더 정확함.
export function useAuth(): UseAuthResult {
  if (DEV_BYPASS_AUTH) {
    return { isAuthenticated: true, isLoading: false };
  }

  return {
    isAuthenticated: Boolean(getAccessToken()),
    isLoading: false,
  };
}
