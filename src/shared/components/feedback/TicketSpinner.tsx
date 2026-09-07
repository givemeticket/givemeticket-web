import type { CSSProperties } from "react";

interface TicketSpinnerProps {
  /** 가로 크기(px). 세로는 2.6:1 비율로 자동 계산됨. */
  size?: number;
  /** 한 번 벌어졌다 다시 붙는 데 걸리는 시간(초). */
  cycleSeconds?: number;
  label?: string;
}

// 티켓을 몸체(body)/줄기(stub) 두 조각으로 나누는 절취선(톱니) 모양의 SVG path.
// clip-path는 border를 잘라내버려서, 굵은 윤곽선은 stroke로만 안전하게 나옴.
// 절취선(톱니) 쪽은 원본 디자인 그대로 각지게 두고, 실제 "종이" 바깥쪽 모서리
// 4곳(원 안 둥근 사각형 느낌)만 반지름 4(100 기준 viewBox라 아주 약간)로 둥글림 —
// 로컬에서 직접 SVG를 렌더링해서 좌표를 눈으로 확인한 값.
const BODY_D =
  "M0 4 A4 4 0 0 1 4 0 H96 A4 4 0 0 1 100 4 L97 8.33 L100 16.66 L97 25 L100 33.33 L97 41.66 L100 50 L97 58.33 L100 66.66 L97 75 L100 83.33 L97 91.66 L100 96 A4 4 0 0 1 96 100 H4 A4 4 0 0 1 0 96 Z";
const STUB_D =
  "M7 0 H96 A4 4 0 0 1 100 4 V96 A4 4 0 0 1 96 100 H7 L0 91.66 L7 83.33 L0 75 L7 66.66 L0 58.33 L7 50 L0 41.66 L7 33.33 L0 25 L7 16.66 L0 8.33 Z";

function TicketOutline({ d }: { d: string }) {
  return (
    <svg className="tk-paper" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path className="tk-face" d={d} strokeLinejoin="round" />
    </svg>
  );
}

// "찢어진 티켓이 절취선을 따라 벌어졌다 다시 붙는" 로딩 스피너. Claude Design에서
// 만든 컴포넌트(TicketSpinner.dc.html)를 이 프로젝트 컨벤션(Tailwind 대신 index.css의
// 전역 클래스/키프레임, CSS 커스텀 프로퍼티)에 맞게 옮겨온 것 — 좌표/구조는 원본
// 그대로 유지함(퍼센트 기반 좌표라 SVG viewBox와 어긋나면 안 돼서 인라인 style로
// 그대로 둠). 안쪽의 짧은 막대들은 티켓에 적힌 텍스트를 흉내낸 스켈레톤 장식.
// 실제 애니메이션(이동/투명도)과 기본 색상(--tk-ink/--tk-paper)은 index.css의
// .tk 관련 규칙에 정의돼 있음.
export function TicketSpinner({
  size = 200,
  cycleSeconds = 1.8,
  label = "불러오는 중",
}: TicketSpinnerProps) {
  const rootStyle: CSSProperties = {
    width: size,
    height: size / 2.6,
    ["--tk-cycle" as string]: `${cycleSeconds}s`,
  };

  return (
    <div className="tk" style={rootStyle} role="status" aria-label={label}>
      <div className="tk-body">
        <TicketOutline d={BODY_D} />
        <div
          style={{
            position: "relative",
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "9%",
            padding: "0 10% 0 8%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6%",
              height: "12%",
            }}
          >
            <div className="tk-mark" style={{ height: "100%", width: "28%" }} />
            <div
              className="tk-mark"
              style={{ flex: "1 1 auto", height: 2, opacity: 0.25 }}
            />
            <div className="tk-mark" style={{ height: "100%", width: "28%" }} />
          </div>
          {/* 이 두 줄만 실제로 깜빡임(tks-bar) — 나머지(위 제목 마크/구분선,
              아래 줄기 쪽 막대들)는 정적인 장식 */}
          <div className="tk-bar" style={{ height: "9%", width: "76%" }} />
          <div className="tk-bar" style={{ height: "9%", width: "46%" }} />
        </div>
      </div>

      <div className="tk-stub">
        <TicketOutline d={STUB_D} />
        <div
          style={{
            position: "relative",
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "6%",
            paddingLeft: "8%",
          }}
        >
          <div className="tk-mark" style={{ height: "7%", width: "50%" }} />
          <div className="tk-mark" style={{ height: "12%", width: "50%" }} />
          <div className="tk-mark" style={{ height: "6%", width: "50%" }} />
          <div className="tk-mark" style={{ height: "10%", width: "50%" }} />
          <div className="tk-mark" style={{ height: "6%", width: "50%" }} />
        </div>
      </div>
    </div>
  );
}
