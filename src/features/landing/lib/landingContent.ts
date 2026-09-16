// LandingPage 스크롤 시퀀스의 문구/슬롯 데이터. templates/landing-ticket-intro의
// 캡션 6개(인트로 + 제품 화면 5개)를 그대로 옮김.

export interface LandingCaption {
  eyebrow: string;
  title: string;
  body: string;
}

// index 0 = 카드가 다 줄어들기 전 보여주는 인트로 캡션, 1~5 = productScreens와 1:1 대응.
export const LANDING_CAPTIONS: LandingCaption[] = [
  {
    eyebrow: "GIVEMETICKET",
    title: "선착순 행사, 한 흐름으로",
    body: "개설부터 참여, 당첨 확인까지 한 서비스 안에서 이어집니다.",
  },
  {
    eyebrow: "행사 개설",
    title: "3분이면 접수가 열립니다",
    body: "이름과 인원, 오픈 시각만 정하면 선착순 접수가 바로 시작됩니다.",
  },
  {
    eyebrow: "나의 행사",
    title: "내가 만든 행사를 한 화면에서",
    body: "신청 현황과 잔여 수량, 들어온 문의가 행사별로 모입니다.",
  },
  {
    eyebrow: "행사 검색",
    title: "플랫폼 전체 행사를 한 번에",
    body: "상태 · 주최자 · 날짜로 좁혀서 원하는 행사를 바로 찾습니다.",
  },
  {
    eyebrow: "행사 상세 · 신청",
    title: "열리는 순간, 서버 시계 기준으로",
    body: "오픈 시각과 잔여 수량을 확인하고 그 자리에서 신청합니다.",
  },
  {
    eyebrow: "나의 티켓",
    title: "응모와 당첨 현황을 한눈에",
    body: "신청한 행사가 티켓으로 쌓이고, 당첨 · 대기 · 마감이 색으로 구분됩니다.",
  },
];

export interface LandingProductScreen {
  id: string;
  label: string;
}

// LANDING_CAPTIONS[1..5]와 같은 순서 — 실제 스크린샷/영상은 아직 없어서
// 지금은 라벨만 있는 자리표시(placeholder)로 채움(campaign-image-placeholder와
// 같은 대각선 줄무늬 스타일). 나중에 이 5개 슬롯에 실제 화면 캡처(정지
// 이미지 또는 스크롤 스크러빙용 영상)를 그대로 끼워넣으면 됨 —
// LandingProductScreens.tsx의 ProductScreenSlot 참고.
export const LANDING_PRODUCT_SCREENS: LandingProductScreen[] = [
  { id: "create", label: "행사 개설 화면" },
  { id: "myevents", label: "나의 행사 화면" },
  { id: "search", label: "행사 검색 화면" },
  { id: "detail", label: "행사 상세 · 신청 화면" },
  { id: "mytickets", label: "나의 티켓 화면" },
];
