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

/** 카드가 없는 화면(행사 추가/수정/신청자 목록 등)에 진입할 때 호출함. 안 그러면,
 * 상세 페이지 방문 시 저장된 값이 "관련 없는 다음 목록 방문"까지 계속 남아있다가,
 * 엉뚱하게 소비되면서 짝 없는 카드가 잠깐 나타났다 사라지는 문제가 있었음. */
export function clearTransitioningCampaign() {
  transitioningCampaignId = null;
}

/** 한 번 읽으면 초기화됨 — 관련 없는 다음 방문에 옛날 값이 남아있지 않도록 */
export function consumeTransitioningCampaignId(): number | null {
  const id = transitioningCampaignId;
  transitioningCampaignId = null;
  return id;
}

// 상세 페이지가 "수정"/"신청자 목록"처럼 카드 없는 화면으로 떠났다가, 뒤로가기로
// 다시 돌아왔을 때를 표시하는 별도 저장소. shortCode 기준인 이유: 상세 페이지가
// 막 마운트된 시점엔 아직 API 응답이 안 와서 숫자 id를 모르고, URL의 shortCode만
// 바로 알 수 있어서. 이게 필요한 이유: 상세 페이지의 카드는 원래 항상 layoutId를
// 갖고 있어야(목록이랑 짝지어지려고) 하는데, "카드 없는 화면에서 막 돌아온" 경우엔
// 짝(그 화면엔 카드가 없었음)이 없어서, layoutId만 든 채로 아무 페이드 없이
// 순간적으로 나타나버리는 문제가 있었음.
let leftToNonCardPageForShortCode: string | null = null;

export function markLeftToNonCardPage(shortCode: string) {
  leftToNonCardPageForShortCode = shortCode;
}

/** 한 번 읽으면 초기화됨 */
export function consumeLeftToNonCardPage(shortCode: string): boolean {
  if (leftToNonCardPageForShortCode === shortCode) {
    leftToNonCardPageForShortCode = null;
    return true;
  }
  return false;
}

/** 이 모듈이 담고 있는 두 값(transitioningCampaignId, leftToNonCardPageForShortCode)을
 * 한 번에 전부 지움. clearTransitioningCampaign()은 앞의 것만 지우는데, 그거랑
 * 별개로 뒤의 것까지 같이 지워야 하는 상황(예: 홈으로 이동)을 위한 함수. */
export function clearAllTransitioningCampaignState() {
  transitioningCampaignId = null;
  leftToNonCardPageForShortCode = null;
}
