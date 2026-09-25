import { useServerClock } from "@/shared/hooks/useServerClock";
import { ClockDigit } from "@/shared/components/clock/ClockDigit";
import { LiveDot } from "@/shared/components/clock/LiveDot";

// 히어로 하단의 "SERVER" 시계 위젯. 헤더 시계(HeaderLiveClock.tsx)와 같은
// 서버-보정 시계 + 같은 자리별 롤오버 효과라, 시각 계산은 useServerClock.ts,
// 숫자 애니메이션은 ClockDigit.tsx, 초록 점은 LiveDot.tsx를 그대로 공유함. 이
// 화면 전용으로 다른 건 레이아웃/색상뿐이라 그 부분만 여기서 짬.
export function LandingServerClock() {
  const { hh, mm, ss, animate } = useServerClock();

  return (
    <span className="flex flex-col gap-1.5">
      <span
        className="font-['Archivo'] text-[10px] font-bold text-white/70"
        style={{ letterSpacing: "0.28em" }}
      >
        SERVER
      </span>
      <span className="flex items-center gap-2">
        <LiveDot />
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
