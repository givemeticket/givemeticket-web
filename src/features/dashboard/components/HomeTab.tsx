// "홈" 탭 placeholder. RootRoute.tsx가 로그인 상태의 "/"에서
// <DashboardLayout><HomeTab /></DashboardLayout>로 직접 조립해서 씀(라우트
// 중첩이 아님 — DashboardLayout.tsx의 children prop 참고). DashboardLayout
// 안에서 쓰이므로 min-h-screen이 아니라 h-full로 남은 공간만 채움
// (UserAppShell.tsx의 "헤더 아래 남은 공간" 주석과 같은 이유).
export function HomeTab() {
  return (
    <div className="flex h-full items-center justify-center text-(--paper)">
      <p className="text-2xl font-bold">홈화면</p>
    </div>
  );
}
