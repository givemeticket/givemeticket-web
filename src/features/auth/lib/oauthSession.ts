// 네이버 CSRF 방지용 state 값 + "로그인 성공 후 어디로 돌아갈지" 를
// OAuth 왕복(카카오/네이버 페이지로 나갔다 돌아오는) 동안 잠깐 들고 있기 위한 저장소.
// 페이지 이동이 껴 있어서 컴포넌트 state로는 못 들고 다니므로 sessionStorage 사용.

const STATE_KEY = "gmt_oauth_state";
const POST_LOGIN_REDIRECT_KEY = "gmt_post_login_redirect";

export function generateState(): string {
  return crypto.randomUUID();
}

export function saveOAuthState(state: string) {
  sessionStorage.setItem(STATE_KEY, state);
}

/** 저장된 state를 꺼내면서 동시에 지움 (1회용) */
export function consumeOAuthState(): string | null {
  const value = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  return value;
}

export function savePostLoginRedirect(path: string) {
  sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, path);
}

/** 저장된 복귀 경로를 꺼내면서 동시에 지움. 없으면 기본값(나의 티켓)으로 */
export function consumePostLoginRedirect(): string {
  const value = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
  sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  return value ?? "/mytickets";
}
