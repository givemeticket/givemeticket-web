// "카드가 있는 캠페인 상세 화면"인지 확인. /campaigns/create는 카드가 없는
// 화면이라 제외해야 하는데, "슬래시 뒤에 슬래시 없는 문자열"만 보는 정규식은
// "create"도 shortCode인 것처럼 매칭해버리는 문제가 있어서 음성 전방탐색으로
// 정확히 그 세그먼트만 제외함. /edit, /applicants 접미사가 붙은 화면도 카드가
// 없는 화면인데, 이 정규식엔 세그먼트가 하나 더 있어서 애초에 안 걸림(제외할
// 필요조차 없음).
//
// UserApp.tsx(RootLayout의 스크롤 오프셋 트릭 판단)와 initialDetailMountStore.ts
// (새로고침으로 상세에 바로 들어왔는지 판단)에 완전히 동일한 정규식이 중복
// 정의돼 있던 걸 여기로 통합함 — 둘 다 "이 경로가 카드 있는 상세 화면인지"라는
// 같은 사실을 판단하고 있어서.
export function isCardDetailPathname(pathname: string): boolean {
  return /^\/campaigns\/(?!create(?:$|\/))[^/]+$/.test(pathname);
}
