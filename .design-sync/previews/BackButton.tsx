import { MemoryRouter } from "react-router-dom";
import { BackButton } from "@/shared/components/BackButton";

// BackButton은 useNavigate()를 쓰기 때문에 Router 컨텍스트가 필요함 - 실제
// 앱에서는 항상 RouterProvider 트리 안에서 렌더링되는 것과 동일하게, 여기서는
// MemoryRouter로 감싸줌(컴포넌트 자체나 사용법을 바꾸는 게 아니라 렌더링에
// 필요한 최소 컨텍스트만 제공).
//
// 아이콘(<) 하나뿐이라 props(fallback/onBeforeNavigate/forceFallback)에 따른
// 시각적 변화가 없음 - 그래서 두 export는 값이 아니라 "쓰이는 맥락"으로 나눔.

// 단독 렌더링 - 가장 기본적인 형태.
export function Default() {
  return (
    <MemoryRouter>
      <BackButton fallback="/mytickets" />
    </MemoryRouter>
  );
}

// CampaignDetailPage/CampaignSubPageShell이 실제로 쓰는 조합 - 뒤로가기
// 버튼과 페이지 제목을 같은 줄(flex items-center gap-1)에 나란히 둠. 디자인
// 에이전트가 실제로 재현하게 될 형태는 대부분 이 조합임.
export function WithPageTitle() {
  return (
    <MemoryRouter>
      <div className="flex items-center gap-1">
        <BackButton fallback="/campaigns/abc123" forceFallback />
        <h1 className="text-lg font-bold text-(--paper)">신청자 목록</h1>
      </div>
    </MemoryRouter>
  );
}
