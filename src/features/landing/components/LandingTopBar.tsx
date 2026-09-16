import { Search } from "lucide-react";
import { LandingSearchField } from "./LandingSearchField";

interface LandingTopBarProps {
  opacity: number;
  /** 0(중간 구간, 아이콘 버튼만) ~ 1(클로징 구간, 검색창 전체)로 서서히
   * 바뀌는 값. templates/landing-ticket-intro 원본은 이 구간용(data-hdr,
   * 아이콘 버튼)과 클로징 섹션용(data-hdr-a, 검색창 전체) 헤더를 따로 뒀음 —
   * LandingPage.tsx가 클로징 진행률(state.closingOpacity)을 그대로 넘겨줌.
   * 예전엔 이 값을 0.5 기준으로 잘라서 둘 중 하나만 그렸는데, 그래서
   * 클로징 섹션에 들어가는 순간 아이콘→검색창이 애니메이션 없이 뚝
   * 바뀌어 보이는 문제가 있었음 — 둘 다 항상 그려두고 opacity로
   * 크로스페이드하는 방식으로 바꿔서 해결함. */
  closingProgress: number;
  /** 아이콘 버튼(중간 구간)을 눌렀을 때 실행할 동작. LandingPage.tsx가
   * "히어로(첫 화면)로 스크롤을 되돌린 뒤 그 검색창에 포커스" 동작을 넘겨줌
   * — 이 구간엔 실제 입력창이 없어서(아이콘뿐이라 타이핑할 자리가 없음)
   * 클릭하면 입력할 수 있는 곳으로 데려다주는 방식. */
  onOpenSearch: () => void;
}

// 카드가 줄어들어 히어로 자체의 로고+검색 줄이 함께 작아진 뒤부터, 화면
// 실제 맨 위에 떠서 계속 보이는 바 — data-hdr/data-hdr-a 두 헤더를 하나의
// 컴포넌트로 합쳤지만(useLandingScrollProgress.ts의 topBarOpacity 계산
// 주석 참고), 검색 버튼 생김새(아이콘만 vs 검색창 전체)는 원본처럼 구간에
// 따라 다르게 둠. 로고/줄 간격/패딩은 LandingHero.tsx의 첫 화면 헤더와
// 정확히 같은 값을 씀 — 클로징 구간(검색창 전체 모드)에서 첫 화면 헤더와
// 완전히 똑같이 보여야 해서(사용자 요청), 여기서 값이 하나라도 다르면
// 바로 티가 남.
export function LandingTopBar({
  opacity,
  closingProgress,
  onOpenSearch,
}: LandingTopBarProps) {
  const interactive = opacity > 0.6;
  const showingInput = closingProgress > 0.5;

  return (
    <div
      className="absolute inset-x-0 top-0 z-30 flex items-center justify-center gap-5 px-[clamp(20px,4vw,40px)] py-[clamp(16px,3vh,28px)]"
      style={{
        opacity,
        transform: `translateY(${(1 - opacity) * -10}px)`,
        pointerEvents: interactive ? "auto" : "none",
      }}
    >
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
      {/* 아이콘 버튼과 검색창(첫 화면과 같은 높이 h-12)을 같은 자리에 겹쳐서
          opacity로 크로스페이드함. 이 래퍼 자신의 폭도 closingProgress에
          맞춰 48px→검색창 폭으로 같이 보간해야 함 — 안 그러면(폭을 계속
          최대치로 고정해두면) 로고+이 래퍼를 가운데 정렬하는 바깥
          flex(justify-center)가, 아직 아이콘만 보이는 중간 구간에서도 이미
          검색창 폭만큼의 자리를 차지한 걸로 계산해서 로고+아이콘 쌍이
          중앙에서 왼쪽으로 치우쳐 보이는 문제가 있었음(실제로 그렇게 보였던
          문제). */}
      <div
        className="relative h-12 shrink-0"
        style={{
          width: `calc(48px + (min(340px, calc(100% - 160px)) - 48px) * ${closingProgress})`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            opacity: closingProgress,
            pointerEvents: showingInput ? "auto" : "none",
          }}
        >
          {/* 기본 className 대신 h-full/w-full을 씀 — 기본값의 w-[min(340px,...)]는
              "이 필드의 부모가 곧 헤더 줄 전체"라고 가정하는데, 여기선 부모가
              이미 위 래퍼에서 그 폭으로 보간해둔 상태라 그대로 쓰면 같은
              계산(-160px)이 중첩돼서 폭이 필요 이상으로 더 줄어듦. 나머지
              스타일(패딩/테두리/색)은 기본값과 완전히 동일하게 맞춰서 첫
              화면 검색창과 똑같이 보이게 함. */}
          <LandingSearchField className="flex h-full w-full items-center gap-2.5 rounded-full border border-white/34 bg-white/10 px-6 transition-colors hover:border-white/60 focus-within:border-(--brand-yellow)!" />
        </div>
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="검색"
          className="absolute left-0 top-0 grid h-12 w-12 place-items-center rounded-full border border-white/28 bg-white/7 text-white/92 transition-colors hover:border-white/58 hover:bg-white/13"
          style={{
            opacity: 1 - closingProgress,
            pointerEvents: showingInput ? "none" : "auto",
          }}
        >
          <Search size={15} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
