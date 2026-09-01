// 경로별 스크롤 위치를 직접 관리. 순수 JS 모듈 메모리에 저장함 — 새로고침하면
// 자연스럽게 초기화돼야 해서(사용자가 새로고침 후엔 스크롤 기억이 유지 안 되길
// 원함). sessionStorage였다면 새로고침해도 값이 남아있었을 텐데, 그건 원하는
// 동작이 아님.
const store = new Map<string, number>();

export function saveScrollPosition(pathname: string) {
  store.set(pathname, window.scrollY);
}

export function getScrollPosition(pathname: string): number {
  return store.get(pathname) ?? 0;
}

/** 저장해둔 모든 경로의 스크롤 위치를 한 번에 지움 */
export function clearAllScrollPositions() {
  store.clear();
}
