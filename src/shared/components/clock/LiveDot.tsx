// "연결됨(실시간)"을 나타내는 초록 점 + 계속 퍼지는 파문(clock-pulse, index.css).
// 헤더 시계(HeaderLiveClock.tsx)와 소개 화면 시계(LandingServerClock.tsx)에
// 똑같은 마크업이 복붙돼 있던 걸 하나로 모음.
export function LiveDot() {
  return (
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
  );
}
