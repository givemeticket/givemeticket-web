import { createPortal } from "react-dom";
import { LoadingScreen } from "@/shared/components/feedback/LoadingScreen";

// LoadingScreen 소스 자체가 "fixed inset-0"으로 뷰포트 정중앙에 고정되는데
// (LoadingScreen.tsx 주석 참고 — 어느 화면에 놓이든 위치가 안 흔들리게 하려는
// 의도적 설계), 이 미리보기 카드 프레임(harness)의 wrapper에 걸린 CSS transform이
// 그 fixed 자손의 기준점을 뷰포트 대신 자기 자신으로 바꿔버려서(CSS 스펙상 알려진
// 동작) 잘려 보이는 문제가 생김 — ConfirmDialog와 동일한 원인. LoadingFade는
// 이미 내부적으로 document.body에 포탈링하지만, LoadingScreen 단독으로는 그렇지
// 않으므로 여기서 createPortal로 감싸서 그 transform 조상을 벗어나게 함(컴포넌트
// 자체는 수정하지 않음).
//
// props가 없는 컴포넌트라 변주 축이 없음 — 단일 상태만 존재.
export function Default() {
  return createPortal(<LoadingScreen />, document.body);
}
