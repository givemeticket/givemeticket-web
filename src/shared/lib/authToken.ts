// 로그인 액세스 토큰 저장소.
// localStorage 기준 — 같은 브라우저의 여러 탭이 로그인 상태를 공유하고,
// 브라우저를 껐다 켜도 로그아웃하기 전까진 유지됨.
// axiosClient가 요청마다 이 값을 읽어 Authorization 헤더에 실음.

const ACCESS_TOKEN_KEY = "gmt_access_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}
