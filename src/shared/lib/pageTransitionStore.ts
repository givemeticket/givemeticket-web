// "지금 어딘가에서 페이지 전환 애니메이션이 진행 중인지"를 페이지 범위를 넘어서
// 전역적으로 알려주는 모듈 저장소. 예: UserAppShell의 헤더(로고/아바타)는 특정
// 페이지에 속하지 않고 항상 고정으로 떠있는 컴포넌트라, 각 페이지 내부에 있는
// useIsPresent() 기반 클릭 차단으로는 이 헤더를 못 가림 — 페이지가 "나가는 중"인
// 것과 무관하게 헤더는 한 번도 "사라지는 컴포넌트"가 된 적이 없어서. 그래서 별도로
// "지금 전환 중" 신호를 만들어서 헤더도 구독할 수 있게 함.
//
// 리액트 state가 아니라 이런 구독 방식(useSyncExternalStore)을 쓰는 이유: 이 값을
// 갱신하는 쪽(RootLayout)이랑 읽는 쪽(UserAppShell)이 서로 부모/자식도 아니고
// 공통 조상도 마땅치 않아서, 평범한 props/state로 넘기기 애매함.
type Listener = () => void;

let isTransitioning = false;
const listeners = new Set<Listener>();

function setIsPageTransitioning(value: boolean) {
  if (isTransitioning === value) return;
  isTransitioning = value;
  listeners.forEach((listener) => listener());
}

export function getIsPageTransitioning(): boolean {
  return isTransitioning;
}

export function subscribeToPageTransition(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let transitionEndTimer: ReturnType<typeof setTimeout> | undefined;

/** 신호를 켜고, 가장 긴 애니메이션(4초) 뒤 자동으로 끔. RootLayout이 감지하는
 * "진짜 전환"뿐 아니라, RootLayout을 거치지 않는 특수한 이동(예: BrandLogo의
 * "/" 이동 — "/"는 UserAppShell 바깥 라우트라 RootLayout이 그 전환 자체를
 * 감지할 기회가 없음)에서도 직접 이 함수를 불러서 씀. 다시 호출되면 이전
 * 타이머를 정리하고 새로 예약함(연속으로 전환이 일어나도 안전하게 겹침). */
export function beginPageTransition() {
  setIsPageTransitioning(true);
  if (transitionEndTimer) clearTimeout(transitionEndTimer);
  transitionEndTimer = setTimeout(() => {
    setIsPageTransitioning(false);
  }, 4000);
}
