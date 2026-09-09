import { TicketSpinner } from "@/shared/components/feedback/TicketSpinner";

// 절취선을 따라 벌어졌다 다시 붙는 CSS 애니메이션 스피너. 정적 스크린샷에서는
// 캡처 시점의 한 프레임만 보이는 게 이 컴포넌트 특성상 자연스러움(애니메이션
// 자체를 정지 화면으로 검증할 방법은 없음) — 형태/레이아웃/기본 색상 확인용.

// 기본 크기(size=200, LoadingScreen 없이 단독으로 쓸 때의 기본값).
export function Default() {
  return <TicketSpinner />;
}

// LoadingScreen이 실제로 쓰는 크기(size=180) — 유일한 실사용 케이스.
export function InLoadingScreen() {
  return <TicketSpinner size={180} />;
}
