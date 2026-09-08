// 상세 페이지 카드에 layoutId(목록 카드와의 공유 레이아웃 이동 애니메이션)가
// 켜져 있는 도중, 헤더의 전역 탭(HeaderTabs.tsx)처럼 "상세 페이지 트리 바깥"에
// 있는 내비게이션 요소를 눌러 그 카드와 무관한 다른 화면으로 떠나는 경우를 위한
// 신호. 이런 이동은 도착 화면(예: 다른 탭의 목록)에 이 카드의 layoutId 짝이
// 있을 수도 없을 수도 있는데(예: "나의 행사"에만 있는 캠페인은 "나의 티켓"
// 목록엔 없음) 미리 알 방법이 없어서, 항상 "짝이 없다"고 가정하고 카드의
// layoutId를 그 즉시 끄도록 알림 — OwnerPanel의 "수정"/"신청자 목록" 버튼이
// onBeforeNavigateToNonCardPage로 이미 하고 있는 것과 같은 트레이드오프(카드가
// 아주 살짝 깜빡이는 정도, useShowCardLayoutId.ts 참고)를 그대로 받아들임.
//
// 짝이 없는 채로 그냥 두면, 카드가 애니메이션 없이 방치되다가 화면의 다른
// 요소들 페이드가 다 끝나야 훅 사라지는 버그가 생김(animation.md 3번 — 실제로
// "나의 행사에만 있는 카드를 상세에서 열고 헤더 탭으로 나의 티켓으로 이동"하는
// 경우에 재현됨).
//
// leftToNonCardPageStore.ts와 다른 점: 그건 "나중에 이 상세로 다시 돌아왔을 때"를
// 위해 값을 기억해뒀다가 한 번 소비하는 저장소고, 이건 "지금 이 순간 마운트돼
// 있는 상세 페이지가 있다면 즉시 반응하라"는 방송(broadcast) 신호라 기억/소비
// 개념이 없음 — 그래서 pageTransitionStore.ts와 같은 구독 패턴을 씀.
const listeners = new Set<() => void>();

/** 상세 페이지 트리 바깥의 내비게이션 요소가 navigate() 직전에 동기적으로 호출함 */
export function announceLeavingCardBehind() {
  listeners.forEach((listener) => listener());
}

export function subscribeToLeavingCardBehind(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
