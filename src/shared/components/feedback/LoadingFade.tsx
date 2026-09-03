import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LoadingScreen } from "./LoadingScreen";

interface LoadingFadeProps {
  isLoading: boolean;
  children: ReactNode;
}

// 로딩 중이면 로딩 화면을 페이드로 보여주고, 끝나면 콘텐츠를 보여줌.
//
// 처음엔 로딩/콘텐츠 둘 다 같은 AnimatePresence(mode="wait") 안에서 서로 자리를
// 바꾸는 방식으로 만들었는데, 이 안쪽 AnimatePresence가 바깥쪽(RootLayout이 페이지
// 전환을 담당하는) AnimatePresence의 exit 애니메이션 추적을 방해하는 문제가 있었음
// — 로딩 화면 자체가 아예 안 보이고, 페이지 전환 시(예: 목록→행사추가) 카드들이
// exit 애니메이션 없이 그대로 남아있다가 훅 사라지는 버그로 나타남
// (AnimatePresence가 중첩되면 서로의 exit 추적을 방해할 수 있음).
//
// 그래서 콘텐츠 쪽엔 더 이상 별도 AnimatePresence를 안 씌우고, 로딩 화면만
// 독립적으로 페이드 처리함. 대신 로딩→콘텐츠 전환이 칼같이 순차적이진 않고(로딩이
// 빠지는 동시에 콘텐츠가 뜨는 정도로) 살짝 겹칠 수 있는데, 이 정도 트레이드오프는
// 감수함 — 목록/상세 페이지의 진짜 애니메이션(카드 이동 등)을 방해 안 하는 게
// 훨씬 중요해서.
export function LoadingFade({ isLoading, children }: LoadingFadeProps) {
  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && children}
    </>
  );
}
