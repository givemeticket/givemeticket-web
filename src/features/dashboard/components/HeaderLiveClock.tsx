import { useServerClock } from "@/shared/hooks/useServerClock";
import { ClockDigit } from "@/shared/components/clock/ClockDigit";
import { LiveDot } from "@/shared/components/clock/LiveDot";

// 헤더 가운데 실시간 시계 위젯(templates/home-overview 참고). 클라이언트
// 로컬 시계 대신 서버 시각(useServerNow.ts)으로 보정해서 보여줌 — 선착순
// 서비스 특성상 "지금이 정확히 몇 시인지"가 신뢰의 문제라, 클라이언트 시계가
// 어긋나 있어도(흔한 일) 화면엔 항상 서버 기준 시각이 보이게 함.
// 틱 타이머/reduced motion 확인은 useServerClock.ts, 자리별 롤오버 애니메이션은
// ClockDigit.tsx(claude.ai/design Mobile Screens 템플릿엔 있었는데 처음 포팅할 때
// 빠뜨렸던 것)가 담당하고, 여기엔 헤더 전용 레이아웃/색상만 남음.
export function HeaderLiveClock() {
  const { hh, mm, ss, animate } = useServerClock();

  return (
    <div
      className="flex items-center gap-2 rounded-full border px-3.5 py-1.5"
      style={{ borderColor: "var(--line)", backgroundColor: "var(--ink-soft)" }}
    >
      <LiveDot />
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
