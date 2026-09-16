import { useLayoutEffect, useRef } from "react";

interface LandingLayoutMeasurerProps {
  headerHeight: number;
  captionGap: number;
  captionHeight: number;
  cardHeight: number;
  onMeasure: (capTop: number) => void;
}

// 캡션(capTop) 위치를 "직접 계산"하지 않고, 브라우저의 flexbox 정중앙
// 정렬에게 실제로 맡긴 뒤 그 결과를 재서 가져오는 컴포넌트. 캡션 높이(capH,
// 이미 LandingCaptionMeasurer.tsx가 실측함) + 간격(captionGap) + 카드
// 높이(cardHeight)만큼을 빈 자리(스페이서 3개)로 채운 뒤, "상단 바 아래
// 영역"(top: headerHeight ~ bottom: 0) 안에서 justify-content:center로
// 정중앙에 두게 하고, 화면엔 안 보이게(visibility:hidden) 그려서 첫 번째
// 스페이서(캡션 자리)가 실제로 어디에 놓였는지를 getBoundingClientRect로
// 읽음. 수식으로 직접 위치를 계산하던 이전 방식이 계속 어긋나서(중앙
// 정렬이 실제로는 안 맞음) — 계산이 아니라 브라우저에게 맡기고 결과만
// 읽는 방식으로 바꿔서, "내 계산이 브라우저의 실제 레이아웃과 정확히
// 같다"를 보장할 필요 자체를 없앰.
export function LandingLayoutMeasurer({
  headerHeight,
  captionGap,
  captionHeight,
  cardHeight,
  onMeasure,
}: LandingLayoutMeasurerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const captionSpacerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    function measure() {
      const wrapper = wrapperRef.current;
      const spacer = captionSpacerRef.current;
      if (!wrapper || !spacer) return;
      const wrapperTop = wrapper.getBoundingClientRect().top;
      const spacerTop = spacer.getBoundingClientRect().top;
      onMeasure(spacerTop - wrapperTop);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [headerHeight, captionGap, captionHeight, cardHeight, onMeasure]);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        visibility: "hidden",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: headerHeight,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          ref={captionSpacerRef}
          style={{ height: captionHeight, width: 1 }}
        />
        <div style={{ height: captionGap }} />
        <div style={{ height: cardHeight, width: 1 }} />
      </div>
    </div>
  );
}
