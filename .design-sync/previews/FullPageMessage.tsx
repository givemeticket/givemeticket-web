import { MemoryRouter } from "react-router-dom";
import { SearchX, Trash2, MapPinOff } from "lucide-react";
import { FullPageMessage } from "@/shared/components/feedback/FullPageMessage";

// FullPageMessage는 내부에서 useNavigate()(홈으로 돌아가기 버튼)를 쓰기 때문에
// react-router-dom의 Router 컨텍스트가 있어야 함. 실제 앱에서는 createBrowserRouter
// 트리 안에서 항상 이 컨텍스트가 제공되므로, 여기서도 동일하게 MemoryRouter로
// 감싸줌(컴포넌트 자체나 사용법을 바꾸는 게 아니라 실제 앱과 같은 전제조건을
// 미리보기에서도 맞춰주는 것).

// 캠페인 상세를 못 찾은 경우 — CampaignDetailPage/CampaignEditPage/
// CampaignApplicantsPage가 공통으로 쓰는 가장 흔한 문구.
export function NotFound() {
  return (
    <MemoryRouter>
      <FullPageMessage
        icon={<SearchX size={32} strokeWidth={1.6} />}
        title="행사를 찾을 수 없어요"
        description="주소가 잘못됐거나, 더 이상 존재하지 않는 행사예요."
      />
    </MemoryRouter>
  );
}

// 개설자가 삭제한 행사에 접근한 경우 — CampaignDetailPage에서 API가 410을
// 내려줄 때만 별도로 분기되는 케이스(위 NotFound와 문구/아이콘이 다름).
export function Deleted() {
  return (
    <MemoryRouter>
      <FullPageMessage
        icon={<Trash2 size={32} strokeWidth={1.6} />}
        title="삭제된 행사예요"
        description="개설자가 이 행사를 삭제했어요."
      />
    </MemoryRouter>
  );
}

// 존재하지 않는 경로(404) — UserApp.tsx의 라우터 catch-all(NotFoundPage).
export function PageNotFound() {
  return (
    <MemoryRouter>
      <FullPageMessage
        icon={<MapPinOff size={32} strokeWidth={1.6} />}
        title="페이지를 찾을 수 없어요"
        description="주소가 잘못됐거나, 더 이상 존재하지 않는 페이지예요."
      />
    </MemoryRouter>
  );
}
