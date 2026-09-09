import { ApplySection } from "@/features/campaign/components/ApplySection";
import type { CampaignDetail } from "@/features/campaign/api/campaignApi";

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
    viewerRole: "VIEWER",
    myApplication: null,
    confirmedCount: 188,
    detail: null,
    ...overrides,
  };
}

// 진행중(OPEN) + 재고 확인 완료 - 가장 흔한 경우, "신청하기" 버튼.
export function Open() {
  const campaign = buildCampaign({ status: "OPEN" });
  return (
    <ApplySection
      campaign={campaign}
      hasStockValue
      isActing={false}
      onApply={() => {}}
      onCampaignOpened={() => {}}
    />
  );
}

// 오픈 전(SCHEDULED) - CountdownApplyButton으로 위임됨.
export function Scheduled() {
  const campaign = buildCampaign({
    status: "SCHEDULED",
    openAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    remainingStock: null,
  });
  return (
    <ApplySection
      campaign={campaign}
      hasStockValue={false}
      isActing={false}
      onApply={() => {}}
      onCampaignOpened={() => {}}
    />
  );
}

// 재고 조회 API 응답을 아직 못 받은 짧은 순간 - "재고 확인 중..." 비활성 버튼.
export function LoadingStock() {
  const campaign = buildCampaign({ status: "OPEN" });
  return (
    <ApplySection
      campaign={campaign}
      hasStockValue={false}
      isActing={false}
      onApply={() => {}}
      onCampaignOpened={() => {}}
    />
  );
}

// 종료된 행사 - "종료된 행사예요" 비활성 버튼. DELETED도 동일 문구로 처리됨.
export function Closed() {
  const campaign = buildCampaign({
    status: "CLOSED",
    remainingStock: 0,
    confirmedCount: 200,
  });
  return (
    <ApplySection
      campaign={campaign}
      hasStockValue
      isActing={false}
      onApply={() => {}}
      onCampaignOpened={() => {}}
    />
  );
}
