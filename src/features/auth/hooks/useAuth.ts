// TODO: 백엔드 인증 방식(세션/쿠키 vs JWT)이 확정되면 실제 로직으로 교체
// 현재는 라우팅 골격 확인용 스텁입니다.
//
// 실제 구현 시에는 보통 react-query의 useQuery로 "내 정보 조회" API를
// 호출해서 성공 여부로 로그인 상태를 판단하는 방식을 씁니다.

interface UseAuthResult {
  isAuthenticated: boolean;
  isLoading: boolean;
}

// 개발용 임시 우회 스위치. 로컬 .env(커밋되지 않음)에
// VITE_DEV_BYPASS_AUTH=true 를 넣으면 로그인 없이도 보호된 화면에 진입할 수 있음.
// import.meta.env.DEV 조건 덕분에 프로덕션 빌드에는 절대 포함되지 않음.
const DEV_BYPASS_AUTH =
  import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === "true";

export function useAuth(): UseAuthResult {
  if (DEV_BYPASS_AUTH) {
    return { isAuthenticated: true, isLoading: false };
  }

  // 스텁: 항상 비로그인 상태로 취급
  return {
    isAuthenticated: false,
    isLoading: false,
  };
}
