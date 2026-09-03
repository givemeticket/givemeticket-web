// 상세 페이지가 "수정"/"신청자 목록"처럼 카드 없는 화면으로 떠났다가, 뒤로가기로
// 다시 돌아왔을 때를 표시하는 저장소. shortCode 기준인 이유: 상세 페이지가 막
// 마운트된 시점엔 아직 API 응답이 안 와서 숫자 id를 모르고, URL의 shortCode만
// 바로 알 수 있어서.
//
// navigationType(PUSH/POP)만으로는 이 케이스를 구분할 수 없어서 별도 저장소가
// 필요함 — "목록 클릭으로 만들어진 상세 항목에 브라우저 앞으로가기로 재진입"과
// "카드 없는 화면에서 뒤로가기로 돌아옴"이 둘 다 POP이라 구분이 안 됨. 전자는
// 목록 카드가 항상 layoutId를 갖고 있으니 상세도 맞춰서 켜야 하고, 후자는 반대로
// 짝(그 화면엔 카드가 없었음)이 없으니 꺼야 함 — 이 둘을 가르는 유일한 기준이
// "직전에 카드 없는 화면으로 실제로 떠났었는지"라서, 그 사실 자체를 여기 남겨둠.
let leftToNonCardPageForShortCode: string | null = null;

// 위 기록은 순수 JS 모듈 변수라, "신청자 목록"/"수정" 화면에서 새로고침하면
// (JS 실행 컨텍스트 자체가 재시작되므로) 통째로 사라짐. 그 상태로 뒤로가기해서
// 상세로 돌아오면, 기록이 없다는 이유로 layoutId가 잘못 켜져서(목록이 안 그려져
// 있어 짝이 없으니 애니메이션 없이 카드가 즉시 나타남) 버그가 됨. 이걸
// 보완하려고, 모듈 로드 시점(=새로고침 시점)의 URL에서 같은 사실을 직접
// 재계산해둠 — 예전 navigationSessionStore.ts가 "새로고침으로 상세에 바로
// 왔는지"를 판정하던 것과 같은 기법. sessionStorage 같은 영구 저장소를 쓰지
// 않는 이유는 scrollPositionStore.ts와 같음 — 이 신호도 "새로고침하면 원칙적으로
// 사라져야 할 임시 신호"이지, 굳이 남겨둘 값이 아님. 다만 이 특정 경우엔 URL
// 자체가 이미 "카드 없는 화면"이라는 사실을 그대로 담고 있어서, 굳이 저장해두지
// 않고도 그 자리에서 다시 확인할 수 있음.
function extractNonCardPageShortCode(pathname: string): string | null {
  const match = /^\/campaigns\/([^/]+)\/(?:edit|applicants)$/.exec(pathname);
  return match ? match[1] : null;
}
let startedOnNonCardPageForShortCode = extractNonCardPageShortCode(
  window.location.pathname,
);

export function markLeftToNonCardPage(shortCode: string) {
  leftToNonCardPageForShortCode = shortCode;
}

/** 한 번 읽으면 초기화됨 — 관련 없는 다음 방문에 옛날 값이 남아있지 않도록 */
export function consumeLeftToNonCardPage(shortCode: string): boolean {
  if (leftToNonCardPageForShortCode === shortCode) {
    leftToNonCardPageForShortCode = null;
    return true;
  }
  if (startedOnNonCardPageForShortCode === shortCode) {
    startedOnNonCardPageForShortCode = null;
    return true;
  }
  return false;
}

/** 홈으로 이동하는 등, 지금까지 쌓인 값이 엉뚱한 나중 방문에 잘못 소비되는 걸
 * 막기 위해 강제로 비울 때 씀. */
export function clearLeftToNonCardPage() {
  leftToNonCardPageForShortCode = null;
}
