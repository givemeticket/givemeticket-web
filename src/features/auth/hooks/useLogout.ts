import { clearAccessToken } from "@/shared/lib/authToken";

// 로그아웃 로직을 훅으로 분리 — 대시보드 헤더뿐 아니라
// 나중에 설정 화면 등 다른 곳에서도 재사용하기 쉽게.
export function useLogout() {
  return function logout() {
    clearAccessToken();
    // navigate()가 아니라 완전한 페이지 새로고침으로 이동함. 저희 페이지 전환
    // 애니메이션(AnimatePresence)이 나가는 화면을 잠깐(0.3초 정도) 화면에 붙잡아두는데,
    // 그 사이 ProtectedRoute도 여전히 살아있는 상태로 리렌더링될 수 있음. 이때
    // useLocation()은 "지금 이 컴포넌트가 어느 스냅샷에 속했는지"랑 무관하게 항상
    // 최신 경로(navigate로 이미 바뀐 "/")를 돌려주기 때문에, ProtectedRoute가
    // "지금 있는 곳(/)이 보호된 라우트인데 토큰이 없네"라고 착각해서 자기 나름대로
    // ?redirect=%2F 같은 걸 붙여 리다이렉트해버리는 문제가 있었음. 완전 새로고침은
    // 지금 떠 있는 리액트 트리를 통째로 날려버려서 이 문제 자체가 안 생김.
    window.location.href = "/";
  };
}
