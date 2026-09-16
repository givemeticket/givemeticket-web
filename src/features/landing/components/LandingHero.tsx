import type { RefObject } from "react";
import { TicketWallBg } from "./TicketWallBg";
import { LandingServerClock } from "./LandingServerClock";
import { LandingSearchField } from "./LandingSearchField";

interface LandingHeroProps {
  opacity: number;
  /** 카드가 거의 안 줄어든, 실제 UI로 보이고 눌러야 하는 상태인지 */
  interactive: boolean;
  wallRunning: boolean;
  onStart: () => void;
  /** LandingPage.tsx가 중간 구간 검색 아이콘 클릭 시 이 화면으로 스크롤을
   * 되돌린 뒤 여기에 포커스를 주기 위해 들고 있는 ref. */
  searchInputRef: RefObject<HTMLInputElement | null>;
}

// 스크롤 시퀀스의 state0 — 처음엔 풀블리드 히어로였다가, 스크롤에 따라 카드
// 크기로 줄어들며 "우리 서비스는 이렇게 생겼습니다"를 보여주는 그림이 됨.
// LandingPage.tsx가 이 전체를 감싸는 div에 scale transform을 걺.
export function LandingHero({
  opacity,
  interactive,
  wallRunning,
  onStart,
  searchInputRef,
}: LandingHeroProps) {
  return (
    <div
      className="absolute inset-0 bg-white"
      style={{
        opacity,
        visibility: opacity > 0.005 ? "visible" : "hidden",
        pointerEvents: interactive ? "auto" : "none",
      }}
    >
      <div className="absolute inset-0 z-0">
        <TicketWallBg theme="dark" running={wallRunning} />
      </div>

      {/* 읽기용 스크림. 위/아래 두 겹만 둠 — TicketWallBg 자체 비네트가 이미
          중심→가장자리 감쇠를 주고 있어서, 레이어를 더 쌓으면 카드 구석은
          거의 안 보일 정도로 과해짐. */}
      <div
        className="pointer-events-none absolute inset-0 z-1"
        style={{
          background:
            "linear-gradient(to top, rgba(8,8,8,.62) 0%, rgba(8,8,8,.56) 32%, rgba(8,8,8,.38) 52%, rgba(8,8,8,.14) 70%, rgba(8,8,8,0) 88%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-1"
        style={{
          background:
            "linear-gradient(to bottom, rgba(8,8,8,.5) 0%, rgba(8,8,8,.28) 11%, rgba(8,8,8,0) 26%)",
        }}
      />

      <div className="absolute inset-x-0 top-0 z-5 flex items-center justify-center gap-5 px-[clamp(20px,4vw,40px)] py-[clamp(16px,3vh,28px)]">
        <div className="flex shrink-0 items-center gap-2">
          <img src="/favicon-transparent-512.png" alt="" className="h-7 w-7" />
          <span
            className="flex flex-col font-['Martian_Mono'] text-[10px] leading-tight font-extrabold text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            <span>GIVEME</span>
            <span>TICKET</span>
          </span>
        </div>
        <LandingSearchField ref={searchInputRef} />
      </div>

      <div className="absolute right-[clamp(20px,3vw,40px)] bottom-[clamp(104px,17vh,150px)] left-[clamp(20px,3vw,40px)] z-4 max-w-225">
        <h1
          className="font-['Martian_Mono'] text-[clamp(26px,4.6vw,74px)] leading-[1.14] font-extrabold text-white"
          style={{ letterSpacing: "-0.02em" }}
        >
          GIVEME
          <br />
          TICKET
        </h1>
        <p
          className="mt-[clamp(10px,1.8vh,18px)] font-['Gothic_A1'] text-[clamp(16px,1.9vw,27px)] font-bold text-(--brand-yellow)"
          style={{ letterSpacing: "0.06em" }}
        >
          선착순 행사 플랫폼
        </p>
        <p className="mt-[clamp(12px,2.2vh,22px)] max-w-135 text-[clamp(14px,1.2vw,17px)] leading-relaxed text-white/88">
          행사 개설, 검색, 선착순 참여 모두 빠르고 쉽게
        </p>
        <div className="mt-[clamp(18px,3vh,30px)] flex items-center gap-3">
          <button
            type="button"
            onClick={onStart}
            className="grid h-13.5 w-39.25 place-items-center bg-[#EDE7DA] text-base font-bold text-[#1B1A16] transition-[filter] hover:brightness-108"
            style={{
              letterSpacing: "0.02em",
              clipPath:
                "path('M 6,0 L 151,0 A 6,6 0 0 1 157,6 L 157,21 L 150,27 L 157,33 L 157,48 A 6,6 0 0 1 151,54 L 6,54 A 6,6 0 0 1 0,48 L 0,33 L 7,27 L 0,21 L 0,6 A 6,6 0 0 1 6,0 Z')",
              filter: "drop-shadow(0 6px 16px rgba(0,0,0,.45))",
            }}
          >
            시작하기
          </button>
        </div>
      </div>

      <div className="absolute right-[clamp(20px,3vw,40px)] bottom-[clamp(24px,5vh,44px)] left-[clamp(20px,3vw,40px)] z-4 flex flex-wrap items-end gap-x-[clamp(26px,4vw,56px)] gap-y-4 border-t border-white/22 pt-[clamp(14px,2.4vh,22px)]">
        <LandingServerClock />
        <span
          className="ml-auto flex items-center gap-2.5 font-['Archivo'] text-[10px] font-bold text-white/66"
          style={{ letterSpacing: "0.28em" }}
        >
          SCROLL
          <svg width="12" height="26" viewBox="0 0 12 26" aria-hidden="true">
            <path
              d="M6 1v22M1.6 18.6 6 23.4l4.4-4.8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}
