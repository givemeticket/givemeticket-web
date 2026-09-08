// 애니메이션 관련 지속시간을 한 곳에 모아둠. 카드 이동/페이지 페이드가 전부 같은
// 값으로 통일돼있어야, 스크롤 오프셋 보정(scrollOffsetStore.ts)이 "언제 다
// 끝나는지"를 정확히 알 수 있음 — 예전엔 각 파일에 흩어진 매직 넘버(0.3/0.35/3/4
// 등)를 따로 관리하다가, 하나만 바꾸고 다른 델 못 바꿔서 타이밍이 어긋나는
// 버그가 반복됐음.
export const PAGE_TRANSITION_DURATION = 0.35;

/** Framer Motion의 transition.duration은 초 단위, setTimeout은 밀리초 단위라
 * 서로 변환해서 씀 (아래 POST_ANIMATION_DELAY_MS 계산에만 내부적으로 쓰임) */
const PAGE_TRANSITION_DURATION_MS = PAGE_TRANSITION_DURATION * 1000;

/** 애니메이션이 "확실히 다 끝난 뒤"에 실행해야 하는 후속 처리(스크롤 스냅, 카드의
 * "이동 중" 특별 취급 해제 등)를 위한 지연값. 애니메이션 자체보다 살짝 더 여유를 둠 —
 * Framer Motion의 layout 애니메이션이 명목 duration보다 실제로 몇십 ms 더 걸리는
 * 드리프트가 있어서(onLayoutAnimationComplete 콜백으로 실측: 14~27ms 범위,
 * animation.md 26번 참고), 그 드리프트를 확실히 덮을 만큼만 더함. */
export const POST_ANIMATION_DELAY_MS = PAGE_TRANSITION_DURATION_MS + 50;
