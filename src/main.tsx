import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

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
