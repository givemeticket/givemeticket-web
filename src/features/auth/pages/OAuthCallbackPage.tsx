import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { exchangeAuthCode } from "../api/authApi";
import { getRedirectUri, type OAuthProvider } from "../lib/oauthUrls";
import {
  consumeOAuthState,
  consumePostLoginRedirect,
} from "../lib/oauthSession";
import { setAccessToken } from "@/shared/lib/authToken";
import { LoadingScreen } from "@/shared/components/LoadingScreen";

type Phase = "processing" | "error";

// /oauth/kakao, /oauth/naver 가 공유하는 콜백 처리 페이지.
// 카카오/네이버가 이 페이지로 돌아오면서 쿼리스트링에 code(와 네이버는 state)를 실어줌.
// /code 호출 한 번으로 로그인/가입이 다 끝나고 바로 액세스 토큰이 나옴.
export function OAuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("processing");
  // StrictMode(개발 모드)가 effect를 두 번 실행시키는 걸 막는 가드.
  // code는 1회용이라 두 번 호출되면 두 번째 호출이 실패함.
  const hasRunRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    async function run() {
      if (provider !== "kakao" && provider !== "naver") {
        setPhase("error");
        setErrorMessage("잘못된 로그인 경로예요.");
        return;
      }

      // 사용자가 로그인 도중 취소하면 provider가 error 파라미터를 실어서 돌려보냄
      const providerError = searchParams.get("error");
      const code = searchParams.get("code");
      const returnedState = searchParams.get("state");

      if (providerError || !code) {
        setPhase("error");
        setErrorMessage("로그인이 취소됐어요.");
        return;
      }

      if (provider === "naver") {
        const savedState = consumeOAuthState();
        if (!savedState || savedState !== returnedState) {
          setPhase("error");
          setErrorMessage("로그인 요청이 유효하지 않아요. 다시 시도해주세요.");
          return;
        }
      }

      try {
        const accessToken = await exchangeAuthCode({
          code,
          provider: provider as OAuthProvider,
          redirectUrl: getRedirectUri(provider as OAuthProvider),
          state: returnedState ?? undefined,
        });

        setAccessToken(accessToken);
        navigate(consumePostLoginRedirect(), { replace: true });
      } catch {
        setPhase("error");
        setErrorMessage("로그인 중 문제가 발생했어요. 다시 시도해주세요.");
      }
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "processing") return <LoadingScreen />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-(--ink) px-6 text-center text-(--paper)">
      <p className="text-sm text-(--paper)">{errorMessage}</p>
      <button
        type="button"
        onClick={() => navigate("/", { replace: true })}
        className="rounded-full px-4 py-2 text-sm font-semibold text-(--on-yellow)"
        style={{ backgroundColor: "var(--brand-yellow)" }}
      >
        로그인 화면으로 돌아가기
      </button>
    </div>
  );
}
