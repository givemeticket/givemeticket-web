// 목록 카드(CampaignListTab.tsx)와 상세 카드(CampaignDetailPage.tsx)가 같은
// layoutId를 받아야 Framer Motion 공유 레이아웃 이동 애니메이션으로 연결됨. 이
// 네이밍 규칙을 양쪽에 각각 하드코딩해두면 나중에 한쪽만 고쳐서 서로 어긋나기
// 쉬워서 함수 하나로 통합함.
export function getCampaignCardLayoutId(campaignId: number): string {
  return `campaign-card-${campaignId}`;
}
