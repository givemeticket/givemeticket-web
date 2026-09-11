import { useSearchParams } from "react-router-dom";
import { buildAuthorizeUrl } from "../lib/oauthUrls";
import {
  generateState,
  saveOAuthState,
  savePostLoginRedirect,
} from "../lib/oauthSession";

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

// "/"의 비로그인용 안내 화면. 예전엔 이름이 LoginPage였는데, 라우팅 구조
// 확장으로 "/sign"이 별도 로그인 전용 화면으로 생기면서 이 컴포넌트는
// "로그인 액션이 일어나는 화면"이 아니라 "/"에서 보여주는 안내
// 화면(비로그인 전용)이라는 성격이 더 정확해져서 이름을 바꿈. 카카오/네이버
// 로그인 버튼 로직은 지금 당장은 그대로 여기 남아있음(/sign은 아직
// placeholder라 실제 로그인 기능이 없음).
export function LandingPage() {
  const [searchParams] = useSearchParams();
  // redirect 파라미터가 없으면(ProtectedRoute를 거치지 않고 그냥 "/"로 바로
  // 들어와서 로그인하는 경우) 로그인 후 "/"(홈 탭)로 돌아오는 게 기본값 —
  // 예전엔 "/mytickets"였는데, "/"가 이제 리다이렉트 없이 홈 탭을 직접
  // 보여주는 정상 목적지가 됐으니 그쪽이 자연스러운 기본값임.
  const redirect = searchParams.get("redirect") ?? "/";

  return (
    <div className="relative min-h-screen overflow-hidden bg-(--ink) text-(--paper)">
      {/* 배경의 은은한 격자/그라데이션 — 순수 단색 배경에 깊이감만 살짝 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, var(--ink-soft), transparent 60%)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-16">
        {/* 워드마크 */}
        <p className="mb-10 text-sm font-semibold tracking-[0.3em] text-(--muted)">
          GIVEMETICKET
        </p>

        {/* 스탬프 히어로 */}
        <div className="relative mb-10 flex h-40 w-40 items-center justify-center">
          <span
            className="ring-anim-1 absolute h-40 w-40 rounded-full border border-(--brand-blue)"
            aria-hidden="true"
          />
          <span
            className="ring-anim-2 absolute h-40 w-40 rounded-full border border-(--brand-blue)"
            aria-hidden="true"
          />
          <img
            src="/favicon-transparent-512.png"
            alt="GiveMeTicket 로고"
            className="stamp-anim relative h-32 w-32 drop-shadow-[0_8px_24px_rgba(26,142,203,0.35)]"
          />
        </div>

        {/* 헤드라인 */}
        <h1 className="text-balance text-center text-[28px] font-extrabold leading-[1.3] tracking-tight">
          선착순 행사를 진행해보세요
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-(--muted)">
          선착순 행사 개설부터 신청까지
          <br />
          3초 로그인으로 시작하세요
        </p>

        {/* 소셜 로그인 */}
        <div className="mt-10 flex w-full flex-col items-center">
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
