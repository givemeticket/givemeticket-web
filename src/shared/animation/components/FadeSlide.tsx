import { motion, type HTMLMotionProps } from "motion/react";
import { PAGE_TRANSITION_DURATION } from "../animationDurations";

interface FadeSlideProps extends HTMLMotionProps<"div"> {
  /** true면 애니메이션 prop(initial/animate/exit/transition) 자체를 안 줌.
   * "이동 중인 카드는 페이드 없이 순수 이동만" 같은 경우에 씀. 요소 타입은 항상
   * motion.div로 유지하고 이 prop만 조건부로 다르게 줘야 함 — 이동 중이냐 아니냐에
   * 따라 <div>/<motion.div>처럼 타입 자체를 바꾸면, 같은 key라도 리액트가 업데이트
   * 대신 언마운트 후 재마운트를 해버려서 요소가 순간 사라졌다 나타나는 버그가 생김
   * (animation.md 2번). */
  disabled?: boolean;
  /** false면 opacity만 애니메이션함(y 이동 없음) — 화면 전체를 덮는 배경색 전용
   * 레이어처럼, 위치 이동이 어색한 경우에 씀. 기본값 true. */
  slide?: boolean;
}

/** DashboardLayout/CampaignDetailPage/CampaignListTab 여러 곳에 복붙돼 있던
 * "opacity+y로 페이드인/아웃" motion.div 패턴을 하나로 모음. opacity/y/duration/ease
 * 값은 전부 기존과 동일하게 유지함 — duration은 PAGE_TRANSITION_DURATION 하나로
 * 항상 통일돼 있어야 스크롤 오프셋 보정(scrollOffsetStore.ts)이 "언제 다 끝나는지"를
 * 정확히 알 수 있어서(animationDurations.ts 참고). */
export function FadeSlide({ disabled, slide = true, ...props }: FadeSlideProps) {
  const animationProps = disabled
    ? {}
    : {
        initial: { opacity: 0, y: slide ? 8 : 0 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: slide ? -8 : 0 },
        transition: { duration: PAGE_TRANSITION_DURATION, ease: "easeInOut" as const },
      };

  return <motion.div {...animationProps} {...props} />;
}
