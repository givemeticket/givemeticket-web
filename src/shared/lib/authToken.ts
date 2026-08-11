// 로그인 액세스 토큰 저장소. sessionStorage 기준 (탭 닫으면 로그아웃).
// axiosClient가 요청마다 이 값을 읽어 Authorization 헤더에 실음.

const ACCESS_TOKEN_KEY = "gmt_access_token";

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}
