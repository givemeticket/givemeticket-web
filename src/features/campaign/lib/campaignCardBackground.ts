import type { CampaignStatus } from "../components/CampaignCard";

// 카드를 감싸는 바깥 motion 요소의 배경색 — status에만 의존함(삭제됨만 별도
// 톤, 나머지는 전부 동일한 기본 표면색). CampaignListTab.tsx(목록)와
// CampaignDetailPage.tsx(상세) 둘 다 각자 렌더링하는 motion.button/motion.div의
// style에 그대로 씀 — 두 곳에서 같은 한 줄짜리 계산이 서로 다르게 어긋나지
// 않도록 함수 하나로 통합함(campaignCardLayoutId.ts와 같은 이유).
export function getCampaignCardBackground(status: CampaignStatus): string {
  return status === "DELETED" ? "var(--deleted)" : "var(--ink-soft)";
}
