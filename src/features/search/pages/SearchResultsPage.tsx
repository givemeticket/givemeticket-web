import { useSearchParams } from "react-router-dom";

// 검색 결과 화면 placeholder — /search?q=... 로 접근. 로그인 여부와 무관하게
// 접근 가능해서 RootLayout 바로 아래(/campaigns/:shortCode와 같은 자리)에
// 있음(UserApp.tsx 참고) — ProtectedRoute를 안 거치므로 헤더는 항상 보이되
// 로그인 없이도 화면 자체는 뜸. h-full로 남은 공간만 채움(min-h-screen이
// 아님 — UserAppShell이 이미 헤더 아래 공간을 잡아주므로).
export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q");

  return (
    <div className="flex h-full items-center justify-center text-(--paper)">
      <p className="text-2xl font-bold">검색 결과 화면{q ? `: ${q}` : ""}</p>
    </div>
  );
}
