import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useServerNow } from "@/shared/hooks/useServerNow";
import { splitClock } from "@/shared/lib/splitClock";

/**
 * 1초마다 갱신되는 서버 보정 시각을 "시/분/초 두 자리 문자열"로 돌려줌.
 * 헤더 시계(features/dashboard의 HeaderLiveClock.tsx)와 소개 화면 시계
 * (features/landing의 LandingServerClock.tsx)가 레이아웃/색상만 다르고
 * "틱 타이머 + reduced motion 확인 + 자리 쪼개기"는 완전히 똑같이 복붙돼
 * 있어서 하나로 모음 — 한쪽만 고치고 다른 쪽을 빠뜨리는 일이 없게.
 *
 * `animate`는 자리별 롤오버 애니메이션(ClockDigit.tsx)을 켤지 여부 —
 * prefers-reduced-motion을 존중해야 해서(index.css의 다른 애니메이션들과 같은
 * 원칙) motion/react의 useReducedMotion으로 확인함.
 */
export function useServerClock(): {
  hh: string;
  mm: string;
  ss: string;
  animate: boolean;
} {
  const serverNow = useServerNow();
  const [now, setNow] = useState(() => Date.now());
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => setNow(serverNow()), 1000);
    return () => clearInterval(timer);
    // serverNow는 매 렌더 새 참조라 deps에 넣으면 타이머가 매초 재시작됨
    // (useServerNow.ts 주석 참고) — 마운트 시 한 번만 걸고, 호출 시점의 최신
    // 오차는 serverNow()가 알아서 반영함.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...splitClock(now), animate: !prefersReducedMotion };
}
