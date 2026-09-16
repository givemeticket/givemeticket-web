import { useLayoutEffect, useRef } from "react";
import { LANDING_CAPTIONS } from "../lib/landingContent";
import { LandingCaptionText } from "./LandingCaptionText";

interface LandingCaptionsProps {
  opacities: number[];
  /** useLandingScrollProgress.ts가 카드 크기에 맞춰 계산한 top 위치(px) —
   * 캡션+카드를 한 그룹으로 화면 중앙에 두기 위한 값이라, 고정값이 아니라
   * 항상 이 prop을 그대로 써야 함(카드와의 간격이 화면 비율에 따라 달라지지
   * 않게 하는 부분). */
  top: number;
  /** 캡션 블록에 예약된 높이(px) — LandingPage.tsx가 아래 onMeasureHeight로
   * 받아서 그대로 넘겨줌. 캡션마다 실제 줄 수가 달라서, 이 높이 안에서
   * 위쪽 정렬을 하면 글자가 짧은 캡션일수록 카드와의 간격이 그만큼 더
   * 벌어져 보임(실제로 그렇게 보였던 문제). 그래서 각 캡션을 이 높이 안에서
   * "아래쪽"에 붙여 그림 — 남는 여백은 항상 글자 위쪽에 생기고, 글자와
   * 카드 사이 간격은 캡션 내용과 무관하게 늘 CAPTION_GAP로 고정됨. 6개
   * 캡션이 전부 eyebrow/제목/본문 각 1줄(LandingCaptionText.tsx)이라 실제
   * 높이가 다 같으므로, 남는 여백도 사실상 0에 가까움. */
  height: number;
  onMeasureHeight: (height: number) => void;
}

// 카드 위에 순차적으로 전환되는 캡션 6개. 6개 다 높이가 같다는 전제
// (LandingCaptionText.tsx 참고)라서, 그중 첫 번째 것의 실제 렌더링 높이만
// 재서 onMeasureHeight로 올려보냄 — 예전엔 이 측정을 위해
// LandingCaptionMeasurer라는 안 보이는 컴포넌트를 따로 하나 더 그렸는데,
// 이미 여기 있는 캡션들(opacity만 0일 뿐 실제로는 항상 렌더링돼 있음)을
// 그대로 재면 되므로 그 중복이 필요 없었음.
export function LandingCaptions({
  opacities,
  top,
  height,
  onMeasureHeight,
}: LandingCaptionsProps) {
  const firstItemRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    function measure() {
      const el = firstItemRef.current;
      if (!el) return;
      onMeasureHeight(el.offsetHeight);
    }
    measure();
    window.addEventListener("resize", measure);
    // 커스텀 폰트(Gothic A1/Archivo)가 로딩되기 전엔 대체 폰트로 줄 높이가
    // 살짝 다르게 측정될 수 있어서, 실제 폰트 로딩이 끝난 뒤 한 번 더 잼.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener("resize", measure);
  }, [onMeasureHeight]);

  return (
    <div
      // pointer-events-none: 이 블록은 순수 텍스트라 클릭할 게 없는데,
      // captionsTop이 shrink=0일 땐 0이라(useLandingScrollProgress.ts) 카드가
      // 안 줄어든 첫 화면에서는 opacity가 0인 채로 헤더/검색창 자리에 그대로
      // 겹쳐 있었음. opacity:0은 클릭을 막아주지 않아서, 안 보이는 이
      // 블록이 그 아래 실제 검색 입력창의 클릭을 가로채고 있었음(실제로
      // 재현됨 — 검색 버튼으로 이동해서 JS로 focus()하는 건 되지만, 사용자가
      // 직접 마우스로 입력창을 클릭하는 건 이 블록에 막혀서 안 됐음).
      className="absolute inset-x-0 z-20 mx-auto w-[min(640px,86vw)] pointer-events-none text-center"
      style={{ top, height }}
    >
      {LANDING_CAPTIONS.map((caption, i) => {
        const o = opacities[i] ?? 0;
        return (
          <div
            key={caption.title}
            ref={i === 0 ? firstItemRef : undefined}
            className="absolute inset-x-0 bottom-0"
            style={{
              opacity: o,
              transform: `translateY(${(1 - o) * 10}px)`,
            }}
          >
            <LandingCaptionText caption={caption} />
          </div>
        );
      })}
    </div>
  );
}
