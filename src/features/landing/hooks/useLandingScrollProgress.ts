import { useEffect, useState, type RefObject } from "react";
import { useMotionValueEvent, useScroll, type MotionValue } from "motion/react";

// templates/landing-ticket-intro의 바닐라 tick() 함수(스크롤/리사이즈 이벤트 +
// requestAnimationFrame으로 매 프레임 style을 직접 mutate하던 로직)를 React로
// 재구현한 것. 스크롤 진행률 자체는 motion의 useScroll이 제공함(이미 내부적으로
// rAF 기준으로 배치돼 있어서 별도 scroll 리스너/rAF 직접 관리가 필요 없음). 각
// 구간(히어로/제품 화면 5개)의 페이드/크로스페이드/닷 인덱스 계산은 원본의
// 수식을 그대로 옮김(아래 computeLandingScrollState). 카드/캡션의 실제 배치
// (어디에 놓일지)는 수식으로 직접 계산하지 않고 LandingLayoutMeasurer.tsx가
// 브라우저의 flexbox 정중앙 정렬로 실측한 값을 그대로 받아 씀 — 수식 계산이
// 계속 실제 화면과 어긋나서, 계산이 아니라 실측으로 바꿈.

export const LANDING_HERO_END = 0.045;
export const LANDING_SHRINK_END = 0.155;
export const LANDING_CLOSE_START = 0.9;
export const LANDING_STATES = 6; // state0 = 히어로가 카드로 줄어든 채 보이는 상태, 1~5 = 제품 화면 5개
const FADE = 0.3;

// 캡션과 카드 사이 간격(px). LandingLayoutMeasurer.tsx가 실제 배치를 잴 때도
// 이 값을 그대로 씀(같은 값을 두 군데서 따로 관리하면 어긋날 수 있어서
// 여기 한 곳에서만 정의하고 export함).
export const LANDING_CAPTION_GAP = 28;
// LandingTopBar.tsx(로고+검색 줄)의 실측 높이 — 캡션+카드 그룹을 이 아래
// 영역에서 정중앙에 두는 기준점으로 씀(LandingLayoutMeasurer.tsx도 동일하게
// 씀).
export const LANDING_HEADER_HEIGHT = 88;
const MIN_MARGIN = 32;
const HORIZONTAL_MARGIN = 40;

/** 캡션 실측 전(마운트 첫 프레임)에만 잠깐 쓰는 값 — 측정이 끝나면 곧바로
 * 실제값으로 교체됨. */
export const FALLBACK_CAPTION_HEIGHT = 130;
/** 캡션+카드 배치 실측 전(마운트 첫 프레임)에만 잠깐 쓰는 값. */
export const FALLBACK_CAPTION_TOP = 150;

// 카드가 다 줄어들었을 때의 목표 scale. 카드 자체의 "적당한 크기"를 정하는
// 값이라 화면 폭(HORIZONTAL_MARGIN 기준)과, 세로로 너무 짧은 화면에서
// 캡션+카드가 안 들어가는 걸 막기 위한 대략적인 높이 여유(MIN_MARGIN 기준)만
// 반영함 — 실제로 "어디에 놓이는지"는 이 값과 무관하게 LandingLayoutMeasurer.tsx가
// 실측함.
export function computeLandingCardScale(
  vw: number,
  vh: number,
  captionHeight: number,
): number {
  const available =
    vh -
    LANDING_HEADER_HEIGHT -
    MIN_MARGIN * 2 -
    captionHeight -
    LANDING_CAPTION_GAP;
  return Math.max(
    0.34,
    Math.min(0.62, available / vh, (vw - HORIZONTAL_MARGIN * 2) / vw),
  );
}

export interface LandingScrollState {
  /** 카드(히어로 화면 전체)의 scale — 1(풀블리드)에서 목표 축소값까지 */
  cardScale: number;
  /** 캡션과 한 그룹으로 화면 중앙에 오도록 카드에 주는 translateY(px) */
  cardTranslateY: number;
  /** 카드 테두리 반경(px) — 줄어들수록 카드처럼 보이게 커짐 */
  cardBorderRadius: number;
  /** 카드가 화면을 완전히 떠날 때(클로징 직전) 페이드아웃 */
  cardOpacity: number;
  cardVisible: boolean;
  /** 카드 안에서 줄어든 화면이 아직 실제 UI처럼 클릭 가능한 상태인지
   * (거의 안 줄었을 때만 true — 다 줄면 "그림"으로만 보여야 해서 클릭을 막음) */
  cardInteractive: boolean;
  /** 6개 상태(히어로+제품화면 5개) 각각의 표시 여부(크로스페이드, 서로 겹치는
   * 구간이 있어 카드가 비어보이는 순간이 없음) */
  screenOpacity: number[];
  /** 6개 캡션 각각의 표시 여부(페이드인→홀드→페이드아웃, 겹치는 구간 없음) */
  captionOpacity: number[];
  /** 캡션 블록의 top 위치(px) — LandingLayoutMeasurer.tsx가 실측한 값에서
   * shrink 진행률(0~1)을 곱한 것 */
  captionsTop: number;
  /** 캡션 블록에 예약된 높이(px) — 캡션 텍스트를 이 안에서 아래쪽에 붙여
   * 그려야(위쪽 정렬이 아니라) 실제 글자와 카드 사이 간격이 캡션 길이와
   * 무관하게 항상 LANDING_CAPTION_GAP과 같아짐(LandingCaptions.tsx 참고) */
  captionsHeight: number;
  /** 히어로 카드가 줄어든 뒤부터 계속 보이는 상단 바(로고+검색) */
  topBarOpacity: number;
  /** 오른쪽 진행 점 표시(0~STATES) */
  dotIndex: number;
  /** 클로징 섹션 */
  closingOpacity: number;
  closingScale: number;
  /** 배경 티켓월 애니메이션을 계속 돌릴지 — 안 보일 때 파킹(성능) */
  heroWallRunning: boolean;
  closingWallRunning: boolean;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

// LandingPage.tsx의 "검색으로 이동"(맨 위로 스크롤 복귀) 애니메이션도 같은
// easing을 씀 — export함.
export function easeInOutQuad(t: number): number {
  const c = clamp01(t);
  return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
}

export function computeLandingScrollState(
  p: number,
  vw: number,
  vh: number,
  captionHeight: number,
  /** LandingLayoutMeasurer.tsx가 실측한, shrink=1일 때 캡션 블록의 최종
   * top 위치(px). */
  captionTop: number,
): LandingScrollState {
  const scale = computeLandingCardScale(vw, vh, captionHeight);
  const cardH = vh * scale;
  // 실측된 캡션 top으로부터 카드 중심이 있어야 할 위치를 구하고, 카드
  // 엘리먼트 자신의 원래 중심(vh/2, position:absolute inset:0 상태의
  // 중심)과의 차이를 translateY로 씀.
  const cardCenterY =
    captionTop + captionHeight + LANDING_CAPTION_GAP + cardH / 2;
  const ty = cardCenterY - vh / 2;

  const shrink = easeInOutQuad(
    (p - LANDING_HERO_END) / (LANDING_SHRINK_END - LANDING_HERO_END),
  );
  const out = clamp01((p - LANDING_CLOSE_START) / 0.05);

  const cardScale = (1 + (scale - 1) * shrink) * (1 - 0.06 * out);
  const cardBorderRadius = (20 / cardScale) * shrink;

  const span =
    (LANDING_CLOSE_START - 0.03 - LANDING_SHRINK_END) / LANDING_STATES;
  const screenOpacity: number[] = [];
  const captionOpacity: number[] = [];

  for (let i = 0; i < LANDING_STATES; i++) {
    const t = (p - (LANDING_SHRINK_END + i * span)) / span;

    // 캡션: 모든 상태가 똑같이 자기 구간의 앞쪽 FADE만큼 페이드인, 뒤쪽
    // FADE만큼 페이드아웃(첫/마지막 캡션도 예외 없음) — 첫 캡션이 아직 카드가
    // 안 줄어든 첫 화면에서부터 보이거나, 마지막 캡션이 클로징 섹션까지
    // 계속 남아있는 문제가 있었어서 다른 캡션들과 같은 규칙으로 통일함.
    captionOpacity.push(Math.min(clamp01(t / FADE), clamp01((1 - t) / FADE)));

    // 화면(제품 스크린샷) 크로스페이드는 캡션과 다르게, 카드가 절대 비어
    // 보이지 않아야 해서 첫/마지막에 예외를 둠: 히어로는 시퀀스가 시작하기
    // 전까지 항상 보이고, 마지막 제품 화면은 카드가 사라지기 전까지 계속
    // 보임(경계에서만 짧게 겹치는 크로스페이드).
    const H = FADE / 2;
    let screenO = Math.min(
      clamp01((t + H) / (2 * H)),
      clamp01((1 - t + H) / (2 * H)),
    );
    // 위 두 예외는 "그 경계에서 formula가 이미 1이 되는 지점"과 정확히
    // 맞물려야 함. 원래는 각각 p<SHRINK_END / t>1을 기준으로 했는데, 그
    // 지점에서 formula 값은 1이 아니라 0.5라서(막 페이드인/아웃을 시작하는
    // 지점) — 예외가 끝나는 순간 1에서 0.5로 뚝 떨어지는 불연속이 있었음.
    // 그 찰나(스크롤 기준 전체의 약 2% 구간)엔 카드 안 두 화면(히어로/마지막
    // 제품화면)의 opacity를 합쳐도 1이 안 돼서, 카드 배경색(bg-white)이
    // 그대로 비쳐 보이는 "하얗게 변하는 순간"으로 나타났음. formula가 실제로
    // 1에 도달하는 지점(t<H / t>1-H)으로 경계를 맞춰서 불연속을 없앰.
    if (i === 0 && t < H) screenO = 1;
    if (i === LANDING_STATES - 1 && t > 1 - H) screenO = 1;
    screenOpacity.push(screenO);
  }

  const dotIndex =
    p < LANDING_SHRINK_END
      ? 0
      : p >= LANDING_CLOSE_START
        ? LANDING_STATES
        : Math.min(
            LANDING_STATES - 1,
            Math.floor((p - LANDING_SHRINK_END) / span),
          );

  // 상단 바(로고+검색): 카드 축소가 60% 진행된 시점부터 페이드인, 그 뒤로는
  // 클로징 섹션까지 계속 떠 있음(원본은 클로징 진입 직전 한 번 사라졌다가
  // 클로징용 헤더로 다시 나타났는데, 굳이 두 헤더를 나눌 이유가 없어서 하나로
  // 합치고 계속 보이게 함 — 의도적으로 단순화한 부분).
  const topBarOpacity = easeInOutQuad(
    (p - (LANDING_HERO_END + (LANDING_SHRINK_END - LANDING_HERO_END) * 0.6)) /
      ((LANDING_SHRINK_END - LANDING_HERO_END) * 0.4),
  );

  const closingOpacity = out;
  const closingScale = Math.max(
    0.62,
    Math.min(1, Math.min(vw * 0.86, vh * 0.82) / 460),
  );

  return {
    cardScale,
    cardTranslateY: ty * shrink,
    cardBorderRadius,
    cardOpacity: 1 - out,
    cardVisible: out < 0.995,
    cardInteractive: shrink < 0.35,
    screenOpacity,
    captionOpacity,
    captionsTop: captionTop * shrink,
    captionsHeight: captionHeight,
    topBarOpacity,
    dotIndex,
    closingOpacity,
    closingScale,
    heroWallRunning: screenOpacity[0] > 0.02,
    closingWallRunning: closingOpacity > 0.02,
  };
}

export function useLandingScrollProgress(
  containerRef: RefObject<HTMLElement | null>,
  /** LandingCaptionMeasurer.tsx가 실측한, 6개 캡션 중 가장 높은 것의 높이(px). */
  captionHeight: number,
  /** LandingLayoutMeasurer.tsx가 실측한 캡션 블록의 최종 top 위치(px). */
  captionTop: number,
): {
  scrollYProgress: MotionValue<number>;
  state: LandingScrollState;
  /** LandingLayoutMeasurer.tsx에 그대로 넘겨서 카드 자리 스페이서 크기로 쓸 값. */
  cardHeightForMeasurement: number;
} {
  const { scrollYProgress } = useScroll({ target: containerRef });

  const compute = (p: number) =>
    computeLandingScrollState(
      p,
      window.innerWidth,
      window.innerHeight,
      captionHeight,
      captionTop,
    );

  const [state, setState] = useState<LandingScrollState>(() =>
    compute(scrollYProgress.get()),
  );
  const [cardHeightForMeasurement, setCardHeightForMeasurement] = useState(
    () =>
      window.innerHeight *
      computeLandingCardScale(
        window.innerWidth,
        window.innerHeight,
        captionHeight,
      ),
  );

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setState(compute(p));
  });

  // 리사이즈나 캡션 실측값(높이/위치)이 바뀌는 것 모두 스크롤 없이도 카드
  // 크기/캡션 위치에 영향을 주므로, 스크롤 값은 그대로 두고 그 시점 스크롤
  // 위치로 다시 계산함.
  useEffect(() => {
    function recompute() {
      setState(compute(scrollYProgress.get()));
      setCardHeightForMeasurement(
        window.innerHeight *
          computeLandingCardScale(
            window.innerWidth,
            window.innerHeight,
            captionHeight,
          ),
      );
    }
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollYProgress, captionHeight, captionTop]);

  return { scrollYProgress, state, cardHeightForMeasurement };
}
