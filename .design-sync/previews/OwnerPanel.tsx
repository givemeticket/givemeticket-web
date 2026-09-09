import { MemoryRouter } from "react-router-dom";
import { OwnerPanel } from "@/features/campaign/components/OwnerPanel";
import { CopyLinkButton } from "@/features/campaign/components/CopyLinkButton";
import type { CampaignDetail } from "@/features/campaign/api/campaignApi";

// OwnerPanel은 내부에서 useNavigate()를 쓰기 때문에 react-router 컨텍스트가
// 없으면 렌더링 자체가 실패함 - 실제 앱에서는 항상 라우터 트리 안에서
// 마운트되므로, 미리보기에서도 MemoryRouter로 감싸서 같은 조건을 맞춰줌
// (내비게이션 자체는 프리뷰에서 발동시키지 않음).
function buildCampaign(overrides: Partial<CampaignDetail>): CampaignDetail {
  return {
    id: 1,
    owner: { id: 1, nickname: "givemeticket_official" },
    shortCode: "nyc2026fanmeeting",
    title: "2026 신년 팬미팅 - 선착순 입장",
    totalStock: 200,
    remainingStock: 12,
    soldOut: false,
    openAt: "2026-01-20T11:00:00Z",
    status: "OPEN",
    viewerRole: "OWNER",
    myApplication: null,
    confirmedCount: 188,
    detail: null,
    ...overrides,
  };
}

// 실제 CampaignDetailPage와 동일하게, 누구나 볼 수 있는 링크 복사 버튼을
// leadingContent로 같이 넣은 형태 - 진행중(OPEN) 상태라 수정/종료/삭제
// 아이콘이 전부 보임.
export function Default() {
  const campaign = buildCampaign({ status: "OPEN" });
  return (
    <MemoryRouter>
      <OwnerPanel
        campaign={campaign}
        isActing={false}
        onDelete={() => {}}
        onClose={() => {}}
        leadingContent={
          <CopyLinkButton
            url={`https://givemeticket.site/campaigns/${campaign.shortCode}`}
            align="left"
          />
        }
      />
    </MemoryRouter>
  );
}

// 종료된(CLOSED) 캠페인 - 더 이상 수정하거나 다시 종료할 수 없어서 "수정"/
// "종료" 아이콘이 사라지고 "신청자 목록"/"삭제"만 남음(OwnerPanel.tsx의
// isClosed 분기).
export function Closed() {
  const campaign = buildCampaign({
    status: "CLOSED",
    remainingStock: 0,
    confirmedCount: 200,
  });
  return (
    <MemoryRouter>
      <OwnerPanel
        campaign={campaign}
        isActing={false}
        onDelete={() => {}}
        onClose={() => {}}
        leadingContent={
          <CopyLinkButton
            url={`https://givemeticket.site/campaigns/${campaign.shortCode}`}
            align="left"
          />
        }
      />
    </MemoryRouter>
  );
}

// 종료/삭제 요청을 처리하는 중(isActing) - "종료"/"삭제" 아이콘이
// disabled:opacity-40으로 흐려짐.
export function Acting() {
  const campaign = buildCampaign({ status: "OPEN" });
  return (
    <MemoryRouter>
      <OwnerPanel
        campaign={campaign}
        isActing
        onDelete={() => {}}
        onClose={() => {}}
        leadingContent={
          <CopyLinkButton
            url={`https://givemeticket.site/campaigns/${campaign.shortCode}`}
            align="left"
          />
        }
      />
    </MemoryRouter>
  );
}
