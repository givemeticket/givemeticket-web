import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// 브라우저 자체의 뒤로가기/앞으로가기 스크롤 자동 복원을 끔. 기본값(auto)이면
// 브라우저가 "이 히스토리 항목은 예전에 스크롤이 579였지" 하고 저희가 만든
// 스크롤 오프셋 보정 시스템(scrollOffsetStore.ts)과 별개로, 예상 못 한 시점에
// 스크롤을 자기 마음대로 바꿔버림 — 뒤로가기로 이미 방문했던 페이지에 돌아올
// 때만 이 문제가 생겼는데(브라우저가 그 항목의 기억을 갖고 있어서), 정확히 이
// 증상과 일치함(로그로 확인함). 스크롤을 저희가 전부 직접 관리하고 있으니,
// 브라우저의 자동 개입은 처음부터 꺼두는 게 맞음.
if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

// 개발 모드의 StrictMode는 컴포넌트를 일부러 두 번 마운트시켜서(부작용 버그를
// 잡아내기 위한 리액트의 안전장치), Framer Motion의 layoutId 애니메이션이 시작하자마자
// 재시작되는 것처럼 보이게 만듦 — 실제 배포에선 없는 현상이지만 개발 중 애니메이션을
// 눈으로 확인할 땐 방해가 됨. .env.local에 VITE_DISABLE_STRICT_MODE=true를 넣어두면
// 이 디버깅 상황에서만 잠깐 꺼둘 수 있음 (기본값은 켜짐 유지).
const strictModeDisabled = import.meta.env.VITE_DISABLE_STRICT_MODE === "true";

const app = strictModeDisabled ? (
  <App />
) : (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById("root")!).render(app);
