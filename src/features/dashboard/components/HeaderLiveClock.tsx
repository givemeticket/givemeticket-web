import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
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
  // claude.ai/design Mobile Screens 템플릿엔 있었는데 처음 포팅할 때
  // 빠뜨렸던 자리별 롤오버 애니메이션(아래 ClockDigit 참고) — prefers-reduced-motion을
  // 존중해야 해서(index.css의 다른 애니메이션들과 같은 원칙) motion/react의
  // useReducedMotion으로 확인함.
  const prefersReducedMotion = useReducedMotion();

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

  const { hh, mm, ss } = splitClock(now);
  const animate = !prefersReducedMotion;

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
        className="flex items-center text-sm font-bold tabular-nums"
        style={{ color: "var(--paper)" }}
      >
        <ClockDigit value={hh[0]} animate={animate} />
        <ClockDigit value={hh[1]} animate={animate} />
        <span className="px-[0.04em] opacity-50">:</span>
        <ClockDigit value={mm[0]} animate={animate} />
        <ClockDigit value={mm[1]} animate={animate} />
        <span className="px-[0.04em] opacity-50">:</span>
        <ClockDigit value={ss[0]} animate={animate} />
        <ClockDigit value={ss[1]} animate={animate} />
      </span>
    </div>
  );
}

// 한 자리(0~9) 전용 "롤오버" 애니메이션 셀. claude.ai/design 템플릿은 바닐라
// DOM으로 이전 숫자를 clone하고 애니메이션이 끝나면 직접 remove했는데, 여긴
// 그 동작을 리액트 상태로 옮김: 값이 바뀌면 이전 레이어는 "나가는 중"으로
// 표시해 gmtOut을 재생하고, 새 레이어는 기본(gmtIn)으로 추가함. 나가는
// 레이어는 자기 애니메이션이 끝나는 순간(onAnimationEnd) 스스로 배열에서
// 빠짐 — 부모가 타이밍을 따로 잴 필요가 없음.
function ClockDigit({ value, animate }: { value: string; animate: boolean }) {
  const [layers, setLayers] = useState<
    { key: number; value: string; leaving: boolean }[]
  >(() => [{ key: 0, value, leaving: false }]);
  const nextKeyRef = useRef(1);

  useEffect(() => {
    setLayers((prev) => {
      const current = prev[prev.length - 1];
      if (current.value === value) return prev;

      // 애니메이션을 껐을 땐(reduced motion) 레이어를 쌓지 않고 그대로
      // 교체함 — animationend가 아예 안 일어나는 애니메이션에 기대어
      // 정리하면 이전 레이어가 영원히 안 지워지고 쌓이기만 하기 때문.
      if (!animate) {
        return [{ key: nextKeyRef.current++, value, leaving: false }];
      }

      return [
        ...prev.map((layer) => ({ ...layer, leaving: true })),
        { key: nextKeyRef.current++, value, leaving: false },
      ];
    });
  }, [value, animate]);

  return (
    <span className="relative inline-block h-[1.25em] w-[0.6em] overflow-hidden align-bottom">
      {layers.map((layer) => (
        <span
          key={layer.key}
          className={`absolute inset-x-0 top-0 flex h-full items-center justify-center ${
            animate ? (layer.leaving ? "gmt-digit-out" : "gmt-digit-in") : ""
          }`}
          onAnimationEnd={() => {
            if (!layer.leaving) return;
            setLayers((prev) => prev.filter((l) => l.key !== layer.key));
          }}
        >
          {layer.value}
        </span>
      ))}
    </span>
  );
}

function splitClock(epochMs: number): { hh: string; mm: string; ss: string } {
  const d = new Date(epochMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    hh: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
  };
}
