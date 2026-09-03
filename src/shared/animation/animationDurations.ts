// 애니메이션 관련 지속시간을 한 곳에 모아둠. 카드 이동/페이지 페이드가 전부 같은
// 값으로 통일돼있어야, 스크롤 오프셋 보정(scrollOffsetStore.ts)이 "언제 다
// 끝나는지"를 정확히 알 수 있음 — 예전엔 각 파일에 흩어진 매직 넘버(0.3/0.35/3/4
// 등)를 따로 관리하다가, 하나만 바꾸고 다른 델 못 바꿔서 타이밍이 어긋나는
// 버그가 반복됐음.
//
// TODO: 지금은 스크롤 오프셋 애니메이션을 눈으로 확인하려고 임시로 2초로
// 늘려둔 상태. 확인 끝나면 프로덕션 값(0.35초)으로 되돌릴 것.
export const PAGE_TRANSITION_DURATION = 2;

/** Framer Motion의 transition.duration은 초 단위, setTimeout은 밀리초 단위라
 * 서로 변환해서 씀 (아래 POST_ANIMATION_DELAY_MS 계산에만 내부적으로 쓰임) */
const PAGE_TRANSITION_DURATION_MS = PAGE_TRANSITION_DURATION * 1000;

/** 애니메이션이 "확실히 다 끝난 뒤"에 실행해야 하는 후속 처리(스크롤 스냅, 카드의
 * "이동 중" 특별 취급 해제 등)를 위한 지연값. 애니메이션 자체보다 살짝 더 여유를 둠. */
export const POST_ANIMATION_DELAY_MS = PAGE_TRANSITION_DURATION_MS + 100;
