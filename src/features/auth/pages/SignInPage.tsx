import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { buildAuthorizeUrl } from "../lib/oauthUrls";
import {
  generateState,
  saveOAuthState,
  savePostLoginRedirect,
} from "../lib/oauthSession";
import { LoadingScreen } from "@/shared/components/feedback/LoadingScreen";

function handleKakaoLogin(redirect: string) {
  savePostLoginRedirect(redirect);
  window.location.href = buildAuthorizeUrl("kakao");
}

function handleNaverLogin(redirect: string) {
  const state = generateState();
  saveOAuthState(state);
  savePostLoginRedirect(redirect);
  window.location.href = buildAuthorizeUrl("naver", state);
}

// 로그인 전용 화면. UserAppShell 트리 바깥(헤더 없음, LandingPage/
// OAuthCallbackPage와 같은 자리)에서 씀(UserApp.tsx 참고). 카카오/네이버
// 로그인 버튼 로직은 원래 LandingPage.tsx(= "/")에 있었는데, "/"가
// features/landing의 스크롤 인트로 화면으로 교체되면서(다크 티켓월 시퀀스,
// 로그인과 무관한 마케팅 콘텐츠) 이 화면으로 옮겨옴 — "/"의 "시작하기" CTA가
// redirect 쿼리파라미터를 그대로 들고 이 화면으로 보내줌.
//
// 이미 로그인한 사용자는 이 화면에 있을 이유가 없어서(로그인할 게 없음)
// "/"로 돌려보냄 — ProtectedRoute가 "로그인 안 했으면 쫓아냄"이라면 이건
// 그 반대(로그인 했으면 쫓아냄). 페이지 하나짜리라 별도 라우트 가드
// 컴포넌트로 안 빼고 이 컴포넌트 안에서 직접 처리함 — 게스트 전용 화면이
// 더 늘어나면 그때 ProtectedRoute처럼 공용 컴포넌트로 뽑을 것.
export function SignInPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-(--ink) px-6 text-(--paper)">
      <p className="mb-10 text-sm font-semibold tracking-[0.3em] text-(--muted)">
        GIVEMETICKET
      </p>

      <h1 className="text-center text-xl font-bold">
        소셜 로그인으로 간편하게 시작하세요
      </h1>

      <div className="mt-10 flex w-full max-w-sm flex-col items-center">
        <div className="mb-6 flex w-full items-center gap-3">
          <span
            className="h-px flex-1"
            style={{ backgroundColor: "var(--line)" }}
          />
          <p className="text-sm font-medium text-(--muted)">시작하기</p>
          <span
            className="h-px flex-1"
            style={{ backgroundColor: "var(--line)" }}
          />
        </div>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => handleKakaoLogin(redirect)}
            aria-label="카카오로 시작하기"
            className="flex h-16 w-16 items-center justify-center rounded-full transition-transform hover:scale-[1.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-yellow) active:scale-[0.97]"
            style={{ backgroundColor: "#FEE500" }}
          >
            <KakaoIcon />
          </button>

          <button
            type="button"
            onClick={() => handleNaverLogin(redirect)}
            aria-label="네이버로 시작하기"
            className="flex h-16 w-16 items-center justify-center rounded-full transition-transform hover:scale-[1.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-blue) active:scale-[0.97]"
            style={{ backgroundColor: "#03C75A" }}
          >
            <NaverIcon />
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-(--muted)">
        로그인 시 이용약관 및 개인정보처리방침에 동의하는 것으로 간주돼요
      </p>
    </div>
  );
}

// --- 인라인 아이콘: 별도 아이콘 라이브러리 없이 24x24 모노라인으로 직접 정의 ---

function KakaoIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 4C6.98 4 3 7.24 3 11.24c0 2.58 1.68 4.84 4.2 6.14-.18.66-.68 2.5-.78 2.9-.12.48.18.47.38.34.16-.1 2.5-1.7 3.52-2.4.55.08 1.12.12 1.68.12 5.02 0 9-3.24 9-7.24S17.02 4 12 4Z"
        fill="#191919"
      />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="6.5 6.5 11 11.1"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14.4 6.5v6.1l-4.8-6.1H6.5v11h3.1v-6.1l4.8 6.1h3.1v-11h-3.1Z"
        fill="white"
      />
    </svg>
  );
}
