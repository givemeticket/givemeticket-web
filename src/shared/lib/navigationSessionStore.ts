// 이 모듈이 로드되는 시점(=이 브라우저 실행이 시작된 시점)의 URL을 그대로 기록해둠.
// 새로고침이든 공유 링크로 바로 들어왔든, 이 값은 항상 "맨 처음 주소"를 가리킴 —
// 리액트 렌더링/이펙트 타이밍이랑 전혀 무관한, 순수 JS 레벨의 확실한 신호라서 안전함.
//
// (예전엔 "클라이언트 사이드 전환이 한 번이라도 있었는지"를 리액트 이펙트로 표시해두는
// 방식을 두 번 시도했었는데, 둘 다 타이밍 문제로 실패했음. 1차: useLayoutEffect(커밋
// 이후)에서 표시했더니, 같은 전환으로 새로 마운트되는 컴포넌트의 렌더링이 그 이펙트보다
// 먼저 일어나서 항상 false로 보임. 2차: 그래서 표시 위치를 BackButton의 클릭 핸들러
// 안(navigate 직전, 동기적으로)으로 옮겼더니, 이번엔 반대로 "그 클릭 자신이 스스로
// 표시해버려서" 목록 쪽에서 확인할 땐 항상 true로 보임 — "이전에 전환이 있었는지"를
// 구분하려던 목적 자체가 무의미해짐. 결국 리액트 생명주기에 걸쳐서 값을 넘기려는
// 시도 자체가 문제였고, 애초에 리액트랑 무관한 시점(모듈 로드)에 값을 정해두는 게 맞음)
const initialPathname = window.location.pathname;

// /campaigns/{shortCode}, /campaigns/{shortCode}/edit, /campaigns/{shortCode}/applicants
// 형태(=캠페인 카드가 실제로 존재하는 상세 관련 화면들)인지 확인. /campaigns/create는
// 카드가 없는 화면이라 제외해야 하는데, "슬래시 뒤에 슬래시 없는 문자열"만 보는
// 이전 정규식(/^\/campaigns\/[^/]+$/)은 "create"도 shortCode인 것처럼 똑같이
// 매칭해버리는 문제가 있었음(음성 전방탐색으로 정확히 "create" 세그먼트만 제외함).
// 반대로 /edit, /applicants 접미사가 붙은 형태는 예전 정규식엔 아예 안 걸렸는데
// (슬래시가 하나 더 있어서), 이 화면들도 캠페인 카드가 있는 화면이라 포함해야 함.
const startedOnDetailPage =
  /^\/campaigns\/(?!create(?:$|\/))[^/]+(?:\/(?:edit|applicants))?$/.test(
    initialPathname,
  );

let hasConsumedFirstReturnFromDetail = false;
// 목록 쪽(hasConsumedFirstReturnFromDetail)이랑 완전히 독립된 별도 트래커.
// 상세 페이지 카드도 대칭으로 처리해야 하는데(안 그러면 목록 카드만 layoutId 없이
// 페이드되고, 상세 카드는 짝 없는 layoutId를 그대로 든 채 방치되다가 페이지의 다른
// 요소들 페이드가 다 끝난 뒤에야 뒤늦게 사라지는 문제가 있었음), 이 둘이 같은 값 하나를
// 나눠 쓰면 안 됨 — 상세 페이지가 목록보다 먼저(마운트 자체가 더 이르므로) 소비해버리면
// 정작 목록 쪽에서 확인할 땐 이미 소진된 뒤라 아무 효과가 없어짐.
let hasConsumedInitialDetailMount = false;

/**
 * 딱 한 번만 true를 반환함 — "새로고침(또는 공유 링크)으로 상세 페이지에 바로
 * 들어온" 바로 그 최초 마운트에만. 그 외엔 항상 false. 상세 페이지가 자기 카드의
 * layoutId를 쓸지 말지 스스로 판단할 때 씀 (위 isFirstReturnFromRefreshedDetailPage랑
 * 짝을 이루는 반대편 판단 — 목록 쪽에서 부르는 이유는 위 함수 설명 참고)
 */
export function isInitialDetailPageMount(): boolean {
  if (startedOnDetailPage && !hasConsumedInitialDetailMount) {
    hasConsumedInitialDetailMount = true;
    return true;
  }
  return false;
}

/**
 * 딱 한 번만 true를 반환함 — "새로고침(또는 공유 링크)으로 상세 페이지에 바로
 * 들어온 뒤, 처음으로 목록에 돌아오는 바로 그 순간"에만. 그 외엔(애초에 목록에서
 * 시작한 경우, 또는 이미 한 번 소비된 이후) 항상 false.
 *
 * 이 순간엔 Framer Motion의 layoutId 공유 애니메이션 추적 시스템이 이 세션에서
 * 그 어떤 layoutId에 대해서도 아직 정상적으로 짝지어진 적이 없어서, 곧바로
 * 역방향(상세→목록) 짝짓기를 시도하면 실패함 (카드가 순간 두 개로 보였다가,
 * 상세 페이지의 다른 요소들 페이드가 다 끝난 뒤에야 뒤늦게 사라지는 버그의 원인).
 */
export function isFirstReturnFromRefreshedDetailPage(): boolean {
  if (startedOnDetailPage && !hasConsumedFirstReturnFromDetail) {
    hasConsumedFirstReturnFromDetail = true;
    return true;
  }
  return false;
}
