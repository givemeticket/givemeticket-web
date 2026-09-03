// 상세 페이지에서 뒤로가기 버튼(인앱 BackButton)을 눌러 목록으로 돌아갈 때,
// "지금 이동 중인 카드가 어떤 캠페인인지"를 목록에 전달하는 저장소. 이 값이
// 있어야 목록이 그 카드에 실제 이동 애니메이션(animateMove)을 걸어줌 — 안
// 그러면 layoutId가 있어도 CampaignCard.tsx가 이동 duration을 0으로 강제해서
// 그냥 순간 등장처럼 보임(CampaignListTab.tsx의 animateMove 참고).
//
// 브라우저 자체의 뒤로가기/앞으로가기는 이 저장소를 거치지 않음(BackButton의
// onBeforeNavigate는 클릭 핸들러라서 native 뒤로/앞으로가기 땐 안 불림) — 그
// 경우는 지금처럼 페이드로 처리됨(의도한 범위).
let returningCampaignId: number | null = null;

export function markReturningCampaign(id: number) {
  returningCampaignId = id;
}

/** 한 번 읽으면 초기화됨 — 관련 없는 다음 방문에 옛날 값이 남아있지 않도록 */
export function consumeReturningCampaignId(): number | null {
  const id = returningCampaignId;
  returningCampaignId = null;
  return id;
}

export function clearReturningCampaign() {
  returningCampaignId = null;
}
