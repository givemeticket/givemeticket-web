import { lazy, Suspense } from "react";

// 여기서 결정하는 건 "어느 앱을 통째로 동적 import할지"뿐임 — UserApp.tsx나
// AdminApp.tsx 안에 있는 페이지 컴포넌트들은 이 시점엔 아직 전혀 로드가 시작 안 된
// 상태라, 방문자는 자기가 온 도메인에 해당하는 앱의 코드만 받아감(반대쪽은 전혀 안 받음).
// main.tsx에 가까운 이 최상단에서 분기해야 하는 이유: 만약 UserApp.tsx 안의 페이지들을
// 여기서 정적 import해버리면(예전 방식), 그 import문 자체가 파일이 로드되는 순간
// 무조건 같이 실행돼서 — 어드민 방문자도 일반 사용자 페이지 코드를 전부 받아가게 됨.
const UserApp = lazy(() =>
  import("./UserApp").then((m) => ({ default: m.UserApp })),
);
const AdminApp = lazy(() =>
  import("./AdminApp").then((m) => ({ default: m.AdminApp })),
);

export function AppRouter() {
  const isAdminHost =
    typeof window !== "undefined" &&
    window.location.hostname.startsWith("admin.");

  return (
    <Suspense fallback={null}>
      {isAdminHost ? <AdminApp /> : <UserApp />}
    </Suspense>
  );
}
