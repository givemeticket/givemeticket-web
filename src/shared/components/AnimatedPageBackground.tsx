import { type ReactNode } from "react";
import { motion } from "motion/react";
import { PAGE_TRANSITION_DURATION } from "@/shared/lib/animationDurations";

interface AnimatedPageBackgroundProps {
  children: ReactNode;
}

// DashboardLayout/CampaignDetailPage가 쓰던 "배경 페이드 레이어 + 콘텐츠 페이드"
// 패턴을 그대로 재사용할 수 있게 뽑음. 최상위 컨테이너 자체(position:relative)를
// 이 컴포넌트가 제공하니, 사용하는 쪽은 그 안의 실제 콘텐츠만 children으로 넘기면
// 됨. 전환 중 클릭 차단은 UserAppShell이 전역으로 처리함(pageTransitionStore.ts 참고).
export function AnimatedPageBackground({
  children,
}: AnimatedPageBackgroundProps) {
  return (
    <div className="relative h-full text-(--paper)">
      {/* 배경색 전용 레이어. 독립적으로 페이드시켜야 함 — 안 그러면 이 화면이 사라지는
          동안에도 불투명한 배경이 화면을 계속 덮어서, 그 밑에서 나타나는 화면이
          거의 끝까지 안 보이다가 마지막 순간에 갑자기 드러나는 문제가 생김. */}
      <motion.div
        className="absolute inset-0 -z-10 bg-(--ink)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: PAGE_TRANSITION_DURATION, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: PAGE_TRANSITION_DURATION, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
}
