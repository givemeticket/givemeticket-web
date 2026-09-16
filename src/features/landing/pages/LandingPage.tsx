import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LandingHero } from "../components/LandingHero";
import { LandingProductScreens } from "../components/LandingProductScreens";
import { LandingTopBar } from "../components/LandingTopBar";
import { LandingCaptions } from "../components/LandingCaptions";
import { LandingLayoutMeasurer } from "../components/LandingLayoutMeasurer";
import { LandingDots } from "../components/LandingDots";
import { LandingClosingSection } from "../components/LandingClosingSection";
import {
  FALLBACK_CAPTION_HEIGHT,
  FALLBACK_CAPTION_TOP,
  LANDING_CAPTION_GAP,
  LANDING_HEADER_HEIGHT,
  easeInOutQuad,
  useLandingScrollProgress,
} from "../hooks/useLandingScrollProgress";

// "/"의 비로그인용 안내 화면(templates/landing-ticket-intro 포팅). 예전엔
// 카카오/네이버 로그인 버튼이 바로 이 화면에 있었는데, 이 다크 스크롤
// 시퀀스로 교체하면서 그 버튼들은 SignInPage.tsx(/sign)로 옮김 — 이 화면의
// "시작하기"는 로그인 버튼 자체가 아니라 /sign으로 보내는 CTA. redirect
// 쿼리파라미터(ProtectedRoute가 비로그인 접근 시 붙여줌)는 그대로 들고 가서
// SignInPage가 로그인 완료 후 원래 목적지로 돌려보낼 수 있게 함.
//
// 900vh짜리 스크롤 스페이서 + position:sticky 무대라는 구조, 그리고 각
// 구간의 페이드/크로스페이드 계산은 useLandingScrollProgress.ts에 정리해둠.
// 카드/캡션이 실제로 "어디에 놓이는지"는 수식으로 직접 계산하지 않음 —
// 캡션 높이(captionHeight)는 LandingCaptions.tsx가 이미 그리고 있는 캡션 중
// 하나를 그대로 재서 올려주고, 캡션 top 위치(captionTop)는
// LandingLayoutMeasurer가 화면에 안 보이게 그려서 브라우저의 flexbox
// 정중앙 정렬 결과를 그대로 재서 가져옴 — 수식 계산이 실제 화면과 계속
// 어긋났던 문제라, 계산이 아니라 실측으로 바꿈.
export function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const spacerRef = useRef<HTMLDivElement>(null);
  const heroSearchInputRef = useRef<HTMLInputElement>(null);
  const scrollToHeroRafRef = useRef<number | undefined>(undefined);
  const [captionHeight, setCaptionHeight] = useState(FALLBACK_CAPTION_HEIGHT);
  const [captionTop, setCaptionTop] = useState(FALLBACK_CAPTION_TOP);
  const onMeasureCaption = useCallback((h: number) => setCaptionHeight(h), []);
  // -10: 실측된 정중앙 위치에서 캡션+카드 묶음을 10px만 더 위로 올려달라는
  // 요청에 따른 수동 보정값. 실측 자체는 그대로 두고 여기서만 살짝 틀어줌.
  const onMeasureLayout = useCallback(
    (top: number) => setCaptionTop(top - 10),
    [],
  );
  const { state, cardHeightForMeasurement } = useLandingScrollProgress(
    spacerRef,
    captionHeight,
    captionTop,
  );

  // 이 화면에 있는 동안만 스크롤바를 숨김(index.css의 html.landing-no-scrollbar
  // 참고) — 스크롤은 여기서 "진행 표시"가 아니라 애니메이션을 움직이는
  // 입력이라 보이는 스크롤바가 방해가 됨. 다른 화면(html 자체 스크롤바
  // 스타일)에는 영향 없게, 이 컴포넌트가 떠 있는 동안만 클래스를 붙였다가
  // 언마운트되면 반드시 지움.
  useEffect(() => {
    document.documentElement.classList.add("landing-no-scrollbar");
    return () => {
      document.documentElement.classList.remove("landing-no-scrollbar");
      if (scrollToHeroRafRef.current !== undefined) {
        cancelAnimationFrame(scrollToHeroRafRef.current);
      }
    };
  }, []);

  function handleStart() {
    navigate(`/sign${location.search}`);
  }

  // 중간 구간 헤더의 검색 아이콘(LandingTopBar.tsx, showSearchInput=false)을
  // 누르면 실제 입력창이 있는 첫 화면(히어로)까지 스크롤을 되돌린 뒤 그
  // 입력창에 포커스를 줌 — templates/landing-ticket-intro 원본의
  // openSearch()와 같은 동작(맨 위로 스크롤 애니메이션 후 포커스)을 그대로
  // 재구현함. window.scrollTo를 rAF로 반복 호출해 부드럽게 0까지 옮기고,
  // 도착한 뒤에야 포커스를 줌 — 스크롤 중에 포커스를 주면 브라우저가 포커스된
  // 요소를 보이게 하려고 스크롤을 다시 건드릴 수 있어서 순서를 이렇게 둠.
  function handleOpenSearch() {
    const from = window.scrollY;
    if (from <= 0) {
      heroSearchInputRef.current?.focus();
      return;
    }
    const duration = 780;
    const start = performance.now();
    if (scrollToHeroRafRef.current !== undefined) {
      cancelAnimationFrame(scrollToHeroRafRef.current);
    }
    function step(now: number) {
      const k = Math.min(1, (now - start) / duration);
      window.scrollTo(0, from * (1 - easeInOutQuad(k)));
      if (k < 1) {
        scrollToHeroRafRef.current = requestAnimationFrame(step);
        return;
      }
      heroSearchInputRef.current?.focus({ preventScroll: true });
    }
    scrollToHeroRafRef.current = requestAnimationFrame(step);
  }

  return (
    <div
      ref={spacerRef}
      // select-none: 이 화면은 텍스트를 읽거나 복사하는 용도가 아니라 스크롤로
      // 넘겨보는 인트로 애니메이션이라, 드래그하면 캡션/워드마크 텍스트가
      // 선택되면서 스크롤 대신 텍스트 선택이 일어나 시퀀스 체험이 깨짐.
      className="relative select-none"
      style={{ height: "900vh", background: "#0C0C0C" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <div
          className="absolute inset-0 overflow-hidden bg-white"
          style={{
            transform: `translateY(${state.cardTranslateY}px) scale(${state.cardScale})`,
            borderRadius: state.cardBorderRadius,
            opacity: state.cardOpacity,
            visibility: state.cardVisible ? "visible" : "hidden",
          }}
        >
          <LandingHero
            opacity={state.screenOpacity[0] ?? 1}
            interactive={state.cardInteractive}
            wallRunning={state.heroWallRunning}
            onStart={handleStart}
            searchInputRef={heroSearchInputRef}
          />
          <LandingProductScreens opacities={state.screenOpacity.slice(1)} />
        </div>

        <LandingTopBar
          opacity={state.topBarOpacity}
          closingProgress={state.closingOpacity}
          onOpenSearch={handleOpenSearch}
        />
        <LandingCaptions
          opacities={state.captionOpacity}
          top={state.captionsTop}
          height={state.captionsHeight}
          onMeasureHeight={onMeasureCaption}
        />
        <LandingDots activeIndex={state.dotIndex} />
        <LandingLayoutMeasurer
          headerHeight={LANDING_HEADER_HEIGHT}
          captionGap={LANDING_CAPTION_GAP}
          captionHeight={captionHeight}
          cardHeight={cardHeightForMeasurement}
          onMeasure={onMeasureLayout}
        />
        <LandingClosingSection
          opacity={state.closingOpacity}
          scale={state.closingScale}
          wallRunning={state.closingWallRunning}
          onStart={handleStart}
        />
      </div>
    </div>
  );
}
