import { TicketWallBg } from "./TicketWallBg";

interface LandingClosingSectionProps {
  opacity: number;
  scale: number;
  wallRunning: boolean;
  onStart: () => void;
}

// 시퀀스 맨 끝 — 카드가 화면을 떠나며 나타나는 클로징 CTA. 배경엔 같은
// 티켓월을 한 번 더 쓰되(TicketWallBg), 은은한 텍스처로만 보이게 어둡게 덮음.
export function LandingClosingSection({
  opacity,
  scale,
  wallRunning,
  onStart,
}: LandingClosingSectionProps) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-1 overflow-hidden"
        style={{ opacity }}
      >
        <div className="absolute inset-0 opacity-30">
          <TicketWallBg theme="dark" running={wallRunning} />
        </div>
        <div className="absolute inset-0 bg-[rgba(12,12,12,0.72)]" />
      </div>

      <div
        className="absolute top-1/2 left-1/2 z-7 w-115 text-center"
        style={{
          opacity,
          transform: `translate(-50%, calc(-50% + ${(1 - opacity) * 22}px)) scale(${scale})`,
          pointerEvents: opacity > 0.6 ? "auto" : "none",
        }}
      >
        <div className="mb-3.5 flex items-center justify-center gap-2">
          <img src="/favicon-transparent-512.png" alt="" className="h-6 w-6" />
        </div>
        <h2
          className="font-['Martian_Mono'] text-2xl leading-[1.16] font-extrabold text-white"
          style={{ letterSpacing: "-0.02em" }}
        >
          GIVEME
          <br />
          TICKET
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-white/78">
          선착순, 지금 바로 시작해보세요.
        </p>
        <div className="mt-5.5 flex justify-center">
          <button
            type="button"
            onClick={onStart}
            className="grid h-12 w-33.5 place-items-center bg-[#EDE7DA] text-[15px] font-bold text-[#1B1A16] transition-[filter] hover:brightness-108"
            style={{
              letterSpacing: "0.02em",
              clipPath:
                "path('M 6,0 L 128,0 A 6,6 0 0 1 134,6 L 134,18 L 127,24 L 134,30 L 134,42 A 6,6 0 0 1 128,48 L 6,48 A 6,6 0 0 1 0,42 L 0,30 L 7,24 L 0,18 L 0,6 A 6,6 0 0 1 6,0 Z')",
              filter: "drop-shadow(0 6px 16px rgba(0,0,0,.45))",
            }}
          >
            시작하기
          </button>
        </div>
        <p
          className="mt-6.5 font-['Archivo'] text-[11px] font-semibold text-white/40"
          style={{ letterSpacing: "0.16em" }}
        >
          © 2026 GIVEMETICKET
        </p>
      </div>
    </>
  );
}
