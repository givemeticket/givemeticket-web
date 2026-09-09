import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HeaderTabs } from "@/features/dashboard/components/HeaderTabs";

// HeaderTabLink 내부에서 useLocation/useNavigate/useQueryClient를 다 쓰므로
// MemoryRouter + QueryClientProvider가 둘 다 필요함. 실제 앱에선 활성 탭
// 표시가 아예 없는 컴포넌트라서(HeaderTabs.tsx 주석 참고 - "지금 어느 탭인지"는
// 각 목록 페이지 제목이 대신 알려줌), 두 탭이 어느 라우트에서든 항상 같은
// 모양으로 보이는 게 정확한 동작임.

function withQueryClient(children: ReactNode) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

// UserAppShell.tsx의 실제 헤더 바(어두운 배경 위 점선 구분선)와 같은 맥락에서
// 렌더링 - 텍스트 색(--muted/--paper)이 실제로 어떤 배경 위에서 쓰이는지 보여줌.
export function Default() {
  return withQueryClient(
    <MemoryRouter initialEntries={["/mytickets"]}>
      <div
        className="flex items-center gap-4 border-b-2 border-dashed p-4"
        style={{
          backgroundColor: "var(--ink)",
          borderColor: "rgba(17,24,39,0.16)",
        }}
      >
        <HeaderTabs />
      </div>
    </MemoryRouter>,
  );
}

// 좁은 화면(모바일 폭)에서도 두 탭 텍스트가 줄바꿈 없이 나란히 들어가는지 확인.
export function NarrowWidth() {
  return withQueryClient(
    <MemoryRouter initialEntries={["/mycampaigns"]}>
      <div
        className="flex items-center gap-4 border-b-2 border-dashed p-4"
        style={{
          backgroundColor: "var(--ink)",
          borderColor: "rgba(17,24,39,0.16)",
          maxWidth: 220,
        }}
      >
        <HeaderTabs />
      </div>
    </MemoryRouter>,
  );
}
