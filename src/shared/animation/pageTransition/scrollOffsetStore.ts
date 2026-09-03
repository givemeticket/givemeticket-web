// "목록↔상세 카드 이동 애니메이션 중엔 실제 스크롤을 그대로 두고, 대신 도착
//페이지 콘텐츠에 임시 오프셋을 걸어서 시각적으로 보정한다"는 기법을 위한 저장소.
//
// 문제 상황: 브라우저 스크롤은 문서 전체에 하나뿐이라, 목록이 스크롤 500인 상태에서
// 상세로 넘어가면 "목록은 500, 상세는 0"을 동시에 만족시킬 방법이 없음. 그래서
// 카드가 위로 튀어오르는 것처럼 부자연스럽게 보였음.
//
// 해결: 전환 애니메이션 내내 실제 스크롤 값을 "떠나는 페이지의 원래 값"에 그대로
// 고정해두고, 대신 도착 페이지 콘텐츠 전체를 그 스크롤값만큼 반대 방향으로
// translateY 오프셋을 걸어서 "마치 이미 도착 페이지의 목표 스크롤에 가 있는 것처럼"
// 보이게 함. 애니메이션이 완전히 끝나는 시점에 오프셋을 없애는 것과 동시에 실제
// 스크롤도 도착 페이지의 목표값으로 바꾸면, 이 둘이 정확히 상쇄되어 화면상 아무
// 변화 없이 "순간이동"됨.
//
// 한 번 읽으면 초기화되는 소모성 값 — 관련 없는 다음 마운트에 옛날 값이 남아있지
// 않도록. "떠나는 페이지의 클릭 시점 스크롤값"만 담아두면 되는데, 방향(목록→상세
// 인지 상세→목록인지)에 따라 부호만 반대로 적용하면 되므로 값 자체는 하나로 충분함.
//
// RootLayout(이 값을 "확인만" 해서 평소 스크롤 복원을 건너뛸지 판단)이랑 도착
// 페이지(이 값을 실제로 "소비"해서 오프셋에 씀), 이렇게 두 소비자가 있는데 —
// 자식(도착 페이지)의 렌더링이 부모(RootLayout)의 useLayoutEffect보다 항상 먼저
// 일어나서, 하나의 값을 공유하면 RootLayout이 확인하는 시점엔 이미 도착 페이지가
// 소비해서 null이 된 뒤라 확인 자체가 무의미해짐. 그래서 두 소비자를 위한 값을
// 완전히 독립적으로 나눔 — 같은 시점에 같이 표시되지만, 각자 따로 소비됨.
let pendingOffsetScrollY: number | null = null;
let pendingOffsetScrollYForRootLayout: number | null = null;

/** 전환을 시작하는 쪽(카드 클릭, 뒤로가기 클릭)이 navigate() 직전에 동기적으로
 * 호출함. 떠나는 페이지의 현재 스크롤값을 넘김. */
export function markPendingScrollOffset(scrollY: number) {
  pendingOffsetScrollY = scrollY;
  pendingOffsetScrollYForRootLayout = scrollY;
}

/** RootLayout이 "이번 전환은 오프셋 방식으로 처리되니 평소처럼 스크롤을 옮기지
 * 말아야 한다"를 판단할 때 씀. 도착 페이지 쪽 값이랑 독립적이라, 도착 페이지가
 * 먼저 자기 값을 소비해도 이 확인엔 영향 없음. */
export function consumePendingScrollOffsetForRootLayout(): boolean {
  const had = pendingOffsetScrollYForRootLayout !== null;
  pendingOffsetScrollYForRootLayout = null;
  return had;
}

/** 도착 페이지가 마운트 시점에 한 번 호출해서 값을 가져감(소모됨) */
export function consumePendingScrollOffset(): number | null {
  const value = pendingOffsetScrollY;
  pendingOffsetScrollY = null;
  return value;
}

/** 소비되지 않고 남아있던 값이 있다면 전부 지움 */
export function clearPendingScrollOffset() {
  pendingOffsetScrollY = null;
  pendingOffsetScrollYForRootLayout = null;
}
