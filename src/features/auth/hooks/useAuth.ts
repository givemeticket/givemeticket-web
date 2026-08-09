// TODO: 백엔드 인증 방식(세션/쿠키 vs JWT)이 확정되면 실제 로직으로 교체
// 현재는 라우팅 골격 확인용 스텁입니다.
//
// 실제 구현 시에는 보통 react-query의 useQuery로 "내 정보 조회" API를
// 호출해서 성공 여부로 로그인 상태를 판단하는 방식을 씁니다.

interface UseAuthResult {
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth(): UseAuthResult {
  // 스텁: 항상 비로그인 상태로 취급
  return {
    isAuthenticated: false,
    isLoading: false,
  };
}
