// "지금 상세 페이지 <-> 목록 페이지 사이를 이동 중인 카드가 어떤 캠페인인지"를
// 방향과 무관하게 기억해두는 모듈 메모리 저장소.
//
// 목록 -> 상세로 갈 때는 클릭 시점에 목록 쪽에서 직접 로컬 state로 추적하니까
// (CampaignListTab.tsx의 transitioningId) 문제없는데, 상세 -> 목록으로 돌아갈 땐
// 클릭 자체가 목록 컴포넌트 밖(상세 페이지)에서 일어나서 그 방식으론 못 잡음.
// 그래서 상세 페이지가 자기 캠페인 id를 여기 적어두면, 목록 페이지가 마운트될 때
// 그 값을 읽어서 "얘가 방금 거기서 돌아온 카드구나"를 판단함.
let transitioningCampaignId: number | null = null;

export function markTransitioningCampaign(id: number | null) {
  transitioningCampaignId = id;
}

/** 한 번 읽으면 초기화됨 — 관련 없는 다음 방문에 옛날 값이 남아있지 않도록 */
export function consumeTransitioningCampaignId(): number | null {
  const id = transitioningCampaignId;
  transitioningCampaignId = null;
  return id;
}
