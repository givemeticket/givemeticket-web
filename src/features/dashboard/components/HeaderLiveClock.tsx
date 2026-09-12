import { useEffect, useRef, useState } from "react";
import { getServerTimeOffset } from "@/shared/lib/serverTime";

// 헤더 가운데 실시간 시계 위젯(templates/home-overview 참고). 클라이언트
// 로컬 시계 대신 서버 시각(serverTime.ts)으로 보정해서 보여줌 — 선착순
// 서비스 특성상 "지금이 정확히 몇 시인지"가 신뢰의 문제라, 클라이언트 시계가
// 어긋나 있어도(흔한 일) 화면엔 항상 서버 기준 시각이 보이게 함.
//
// CountdownApplyButton.tsx와 똑같은 패턴을 그대로 씀: offset을 state가 아니라
// ref로 들고 있음 — state였다면 오차 측정 API 응답이 도착해서 offset이
// 갱신될 때마다 아래 setInterval 이펙트가 재실행되며 타이머가 재시작돼,
// 화면 숫자가 최대 1초 가까이 멈춰있는 것처럼 보이는 버그가 있었음. ref로
// 두면 값이 갱신돼도 리렌더/이펙트 재실행이 없어서, 타이머는 처음 그대로
// 쭉 이어지고 매 틱마다 그 시점의 최신 오차만 조용히 반영됨.
export function HeaderLiveClock() {
  const offsetRef = useRef(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    getServerTimeOffset()
      .then((offset) => {
        if (!cancelled) offsetRef.current = offset;
      })
      .catch(() => {
        // 실패하면 로컬 시계(오차 0)로 계속 진행 — 시계가 아예 안 뜨는
        // 것보단 나음(CountdownApplyButton과 동일한 방침).
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now() + offsetRef.current);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="flex items-center gap-2 rounded-full border px-3.5 py-1.5"
      style={{ borderColor: "var(--line)", backgroundColor: "var(--ink-soft)" }}
    >
      {/* "연결됨"을 나타내는 점 + 계속 퍼지는 파문(clock-pulse, index.css) */}
      <span className="relative flex h-1.75 w-1.75">
        <i
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: "var(--success)" }}
        />
        <i
          className="clock-pulse absolute inset-0 rounded-full"
          style={{ backgroundColor: "var(--success)" }}
        />
      </span>
      <span
        className="text-sm font-bold tabular-nums"
        style={{ color: "var(--paper)" }}
      >
        {formatClock(now)}
      </span>
    </div>
  );
}

function formatClock(epochMs: number): string {
  const d = new Date(epochMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
