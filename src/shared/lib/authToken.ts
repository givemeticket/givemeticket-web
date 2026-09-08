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

/** JWT의 payload에서 exp(만료 시각, 초 단위 유닉스 타임스탬프)만 읽어서 지금
 * 이미 지났는지 확인함 — 서명 검증은 안 하므로(그건 여전히 백엔드가 매 요청마다
 * 함) "이 토큰이 진짜인지"는 판단 못 하지만, "당연히 만료된 걸 미리 거르는"
 * 용도로는 충분하고 네트워크 요청 없이 즉시 판단 가능함(useAuth.ts가 로그인
 * 여부를 판단할 때 씀 — 원래는 "저장돼 있는지"만 봐서, 만료된 토큰이 남아있으면
 * 실제 API를 호출해 401을 받아야만 로그아웃 처리됐음).
 * 형식이 예상과 다르거나 파싱에 실패하면(토큰이 JWT가 아니거나 손상됐으면)
 * 안전한 쪽으로 만료됨 취급함. */
export function isAccessTokenExpired(token: string): boolean {
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return true;
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(atob(padded)) as { exp?: unknown };
    if (typeof payload.exp !== "number") return true;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}
