// RootLayout(UserApp.tsx)이 페이지 전환마다 판단해야 하는 순수 규칙들을 모아둠 —
// 원래 UserApp.tsx 안에 export 없이 정의돼 있었는데, 라우터 정의 파일이 이런
// 순수 로직까지 떠안고 있으면 관련 규칙을 찾기 어려워서 이 파일로 분리함.
import { isCardDetailPathname } from "./cardDetailPathname";
import { saveScrollPosition as saveScrollPositionRaw } from "./scrollPositionStore";

// 스크롤 복원이 의미 없는 경로(수정/신청자 목록)는 저장 자체를 건너뜀. 이 두
// 화면은 짧은 폼/목록이라 스크롤 복원할 가치가 딱히 없는데, `shortCode`가 경로에
// 들어가다 보니 방문한 캠페인 수만큼 sessionStorage에 안 쓰이는 키가 계속 쌓이는
// 낭비가 있었음. 반대로 캠페인 상세(`/campaigns/{shortCode}`)나 행사 추가
// (`/campaigns/create`)는 목록↔이동 왕복에서 실제로 쓰이니 그대로 유지함 — 상세도
// shortCode가 들어가 똑같이 계속 쌓이긴 하지만, 이건 "목록↔상세" 스크롤 복원에
// 실제로 필요한 저장이라 감수함.
function isScrollWorthSaving(pathname: string): boolean {
  return !pathname.endsWith("/edit") && !pathname.endsWith("/applicants");
}

export function saveScrollPosition(pathname: string) {
  if (!isScrollWorthSaving(pathname)) return;
  saveScrollPositionRaw(pathname);
}

const CARD_LIST_PATHNAMES = new Set(["/mytickets", "/mycampaigns"]);

// 목록↔상세처럼 스크롤 오프셋 트릭(scrollOffsetStore.ts — 도착 화면이 스크롤이
// 이미 맞은 것처럼 보이게 하는 방식)을 서로 지원하는 화면 사이의 전환인지 확인.
// 이 조합이 아니면 오프셋을 걸어도 어차피 아무도 안 읽어서 의미가 없고, 다음
// 전환 때까지 안 쓰이고 남아있게 둘 이유도 없어서 아예 안 건다.
export function supportsScrollOffsetTrick(
  leavingPathname: string,
  arrivingPathname: string,
): boolean {
  return (
    (CARD_LIST_PATHNAMES.has(leavingPathname) &&
      isCardDetailPathname(arrivingPathname)) ||
    (isCardDetailPathname(leavingPathname) &&
      CARD_LIST_PATHNAMES.has(arrivingPathname))
  );
}

// /mytickets, /mycampaigns는 같은 DashboardLayout 안에서 탭 내용만 바뀌는 거라
// 페이지 전환 애니메이션이 필요 없음 — 둘을 같은 키("dashboard")로 묶어서,
// 이 둘 사이 이동에서는 AnimatePresence가 키 변화를 감지 못하게(=애니메이션 안 걸리게) 함.
// 그 외(상세/생성/체크아웃 등) 진짜 다른 페이지로 넘어갈 때만 실제로 키가 바뀌어서 애니메이션이 걸림.
export function getAnimationKey(pathname: string): string {
  if (pathname === "/mytickets" || pathname === "/mycampaigns")
    return "dashboard";
  return pathname;
}
