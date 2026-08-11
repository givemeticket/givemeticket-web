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

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/mytickets";

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
          선착순 행사 개설부터 신청, 결제까지
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
            <p className="text-base font-medium text-(--muted)">시작하기</p>
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
