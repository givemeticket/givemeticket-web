// 이 모듈이 로드되는 시점(=이 브라우저 탭의 현재 세션이 시작된 시점, 새로고침
// 포함)의 URL을 그대로 기록해둠 — 리액트 렌더링/이펙트 타이밍과 무관한 순수
// JS 레벨의 신호라서 안전함.
//
// 왜 필요한가: location.state(cameFrom)와 navigationType(PUSH/POP)만으로는
// "카드 클릭으로 상세에 들어왔다가 이 페이지에서 새로고침한 경우"와 "목록
// 클릭으로 만들어진 항목에 브라우저 앞으로가기로 재진입한 경우"를 구분할 수
// 없음 — 새로고침도 POP으로 보고되고, location.state는 새로고침해도 그대로
// 남아있음. 이 둘을 가르는 유일한 차이가 "이 세션이 실제로 이 URL에서 막
// 시작됐는지"라서, 그 사실 자체를 여기 남겨둠(예전 navigationSessionStore.ts와
// 같은 기법).
const initialPathname = window.location.pathname;

function isCardDetailPathname(pathname: string): boolean {
  return /^\/campaigns\/(?!create(?:$|\/))[^/]+$/.test(pathname);
}

const startedOnDetailPage = isCardDetailPathname(initialPathname);

let hasConsumed = false;

/** 딱 한 번만 true를 반환함 — 이 세션이 새로고침(또는 공유 링크)으로 상세
 * 페이지에 바로 들어온 바로 그 최초 마운트에만. */
export function isInitialDetailPageMount(): boolean {
  if (startedOnDetailPage && !hasConsumed) {
    hasConsumed = true;
    return true;
  }
  return false;
}
