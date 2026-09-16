import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useServerNow } from "@/shared/hooks/useServerNow";
import { splitClock } from "@/shared/lib/splitClock";
import { ClockDigit } from "@/features/dashboard/components/HeaderLiveClock";

// 히어로 하단의 "SERVER" 시계 위젯. 자리별 숫자 롤오버 애니메이션은
// HeaderLiveClock.tsx(헤더 시계)가 이미 구현해둔 ClockDigit을 그대로 재사용함
// (같은 서버-보정 시계 + 같은 롤오버 효과라 새로 만들 이유가 없음). 이 화면
// 전용으로 다른 건 레이아웃/색상뿐이라 그 부분만 새로 짬.
export function LandingServerClock() {
  const serverNow = useServerNow();
  const [now, setNow] = useState(() => Date.now());
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => setNow(serverNow()), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { hh, mm, ss } = splitClock(now);
  const animate = !prefersReducedMotion;

  return (
    <span className="flex flex-col gap-1.5">
      <span
        className="font-['Archivo'] text-[10px] font-bold text-white/70"
        style={{ letterSpacing: "0.28em" }}
      >
        SERVER
      </span>
      <span className="flex items-center gap-2">
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
          className="flex items-center font-['Archivo'] text-2xl font-bold text-white tabular-nums"
          style={{ letterSpacing: "0.02em" }}
        >
          <ClockDigit value={hh[0]} animate={animate} />
          <ClockDigit value={hh[1]} animate={animate} />
          <span className="px-[0.06em] opacity-45">:</span>
          <ClockDigit value={mm[0]} animate={animate} />
          <ClockDigit value={mm[1]} animate={animate} />
          <span className="px-[0.06em] opacity-45">:</span>
          <ClockDigit value={ss[0]} animate={animate} />
          <ClockDigit value={ss[1]} animate={animate} />
        </span>
      </span>
    </span>
  );
}
