export type OAuthProvider = "kakao" | "naver";

// 카카오/네이버 콘솔에 등록해둔 Redirect URI와 반드시 한 글자도 다르지 않아야 함.
// window.location.origin을 쓰면 로컬(http://localhost:5173 또는 네이버용 127.0.0.1)과
// 배포(https://givemeticket.site) 환경에서 값이 자동으로 맞게 바뀜.
export function getRedirectUri(provider: OAuthProvider): string {
  return `${window.location.origin}/oauth/${provider}`;
}

export function buildAuthorizeUrl(
  provider: OAuthProvider,
  state?: string,
): string {
  const redirectUri = getRedirectUri(provider);

  if (provider === "kakao") {
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_KAKAO_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      // 백엔드가 /code에서 id_token을 검증하는데, 이 scope가 없으면 카카오가 id_token을 안 줌
      scope: "openid",
    });
    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  }

  // 네이버는 state가 필수
  const params = new URLSearchParams({
    response_type: "code",
    client_id: import.meta.env.VITE_NAVER_CLIENT_ID,
    redirect_uri: redirectUri,
    state: state ?? "",
  });
  return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
}
