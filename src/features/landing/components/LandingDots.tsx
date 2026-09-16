import { LANDING_STATES } from "../hooks/useLandingScrollProgress";

interface LandingDotsProps {
  activeIndex: number;
}

// 화면 우측의 진행 표시 점 — 인트로 1개 + 제품 화면 5개 = 총 6단계
// (LANDING_STATES) 만큼 존재.
export function LandingDots({ activeIndex }: LandingDotsProps) {
  return (
    <div className="pointer-events-none absolute top-1/2 right-6.5 z-20 flex -translate-y-1/2 flex-col gap-2.25">
      {Array.from({ length: LANDING_STATES + 1 }, (_, i) => (
        <i
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-white transition-opacity duration-200"
          style={{ opacity: i === activeIndex ? 1 : 0.3 }}
        />
      ))}
    </div>
  );
}
