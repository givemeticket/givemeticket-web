import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { LoadingScreen } from "./LoadingScreen";
import { PAGE_TRANSITION_DURATION } from "@/shared/animation/animationDurations";

interface LoadingFadeProps {
  isLoading: boolean;
  children: ReactNode;
}

/** 스피너가 일단 뜨면 최소 이만큼(ms)은 유지함 — 뜨자마자 바로 사라지는
 * "깜빡임"을 방지.
 *
 * "로딩이 짧으면 스피너 자체를 아예 안 띄우는" 지연(SHOW_DELAY) 방식도
 * 시도해봤는데, 그 지연 동안 로딩 상태와 무관하게 항상 즉시 나타나는
 * 탭/정렬 필터줄 같은 요소가 "스피너보다 먼저 잠깐 보였다가 나중에
 * 가려지는" 어색함이 생겼음(사용자 확인함). 그래서 지연 없이 로딩이
 * 시작되는 즉시 스피너를 띄우는 걸로 되돌리고, 최소 유지 시간만 남김 —
 * 그러면 스피너가 탭이랑 항상 같은 타이밍에 나타나서 그 어색함은 없고,
 * 대신 아주 짧은 로딩도 최소 이 시간만큼은 스피너가 보임(트레이드오프,
 * 사용자가 직접 써보고 되돌릴지 판단하기로 함). */
const MIN_VISIBLE_MS = 500;

// 로딩 중이면 로딩 화면을 페이드로 보여주고, 끝나면 콘텐츠를 보여줌.
//
// 처음엔 로딩/콘텐츠 둘 다 같은 AnimatePresence(mode="wait") 안에서 서로 자리를
// 바꾸는 방식으로 만들었는데, 이 안쪽 AnimatePresence가 바깥쪽(RootLayout이 페이지
// 전환을 담당하는) AnimatePresence의 exit 애니메이션 추적을 방해하는 문제가 있었음
// — 로딩 화면 자체가 아예 안 보이고, 페이지 전환 시(예: 목록→행사추가) 카드들이
// exit 애니메이션 없이 그대로 남아있다가 훅 사라지는 버그로 나타남
// (AnimatePresence가 중첩되면 서로의 exit 추적을 방해할 수 있음).
//
// 그래서 콘텐츠 쪽엔 별도 AnimatePresence를 안 씌우고, 로딩 화면만 독립적으로
// 페이드 처리함.
//
// 로딩 화면을 굳이 createPortal로 document.body 밑에 그리는 이유: RootLayout
// 전체가 <LayoutGroup>(UserApp.tsx)으로 감싸져 있어서, layoutId 없는 이 로딩
// 화면도 그 그룹 범위 안에 같이 들어가 있었음. 그랬더니 카드처럼 layoutId로
// 위치가 추적되는 요소들의 "레이아웃 확정"이, 카드 자신의 페이드가 끝난
// 뒤가 아니라 같은 그룹 안의 로딩 화면 exit 애니메이션이 완전히 끝날 때까지
// 미뤄지는 문제가 있었음 — 그래서 카드는 훨씬 일찍 다 나타났는데도, 로딩
// 화면이 사라지는 바로 그 순간에 카드 위치가 뒤늦게 "확정"되면서 순간이동한
// 것처럼 보였음(로딩 화면의 duration만 3초로 늘려보면 순간이동도 정확히 3초
// 뒤로 밀리는 것으로 실제 확인함 — 카드 자신의 duration과는 무관했음). 로딩
// 화면은 position: fixed라 어차피 DOM 어디에 있든 화면상 위치가 똑같으므로,
// LayoutGroup이 감싸는 트리 바깥(document.body)으로 완전히 빼내서 카드의
// layoutId 추적과 아예 엮이지 않게 함.
export function LoadingFade({ isLoading, children }: LoadingFadeProps) {
  // 스피너를 실제로 보여줄지 여부. isLoading이 true가 되는 순간 지연 없이
  // 즉시 true로 반영됨(아래 렌더링 중 비교) — 그래야 로딩과 무관하게 항상
  // 즉시 나타나는 탭/정렬 필터줄 같은 요소랑 정확히 같은 타이밍에 나타나서,
  // "그 요소들이 스피너보다 먼저 잠깐 보였다가 나중에 가려지는" 어색함이
  // 없음. 대신 한 번 뜨면 MIN_VISIBLE_MS는 무조건 유지함(뜨자마자 바로
  // 사라지는 깜빡임 방지).
  const [showSpinner, setShowSpinner] = useState(isLoading);
  // 스피너가 실제로 화면에 뜬 시각. 최소 유지 시간을 계산하는 기준. ref
  // 쓰기는 렌더링 중이 아니라 커밋 후 이펙트에서 해야 해서(react-hooks/refs),
  // "언제 켜졌는지 기록"은 아래 의존성 배열 없는 이펙트(매 렌더 이후 실행)에서
  // 따로 함 — WheelColumn.tsx의 commitRef와 같은 패턴.
  const shownAtRef = useRef<number | null>(null);

  // isLoading이 true인데 아직 스피너가 안 켜진 상태면(막 로딩이 시작된 순간)
  // 렌더링 중 바로 반영함 — 리액트가 커밋 전에 이 컴포넌트를 한 번 더
  // 그려주기 때문에 화면엔 항상 최신 값만 보임(UserApp.tsx의
  // scrollOffsetMarkedForPathname과 같은 패턴).
  if (isLoading && !showSpinner) {
    setShowSpinner(true);
  }

  useEffect(() => {
    if (showSpinner && shownAtRef.current === null) {
      shownAtRef.current = Date.now();
    }
  });

  useEffect(() => {
    if (isLoading) return;
    if (shownAtRef.current === null) return;

    const elapsed = Date.now() - shownAtRef.current;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const hideTimer = setTimeout(() => {
      setShowSpinner(false);
      shownAtRef.current = null;
    }, remaining);
    return () => clearTimeout(hideTimer);
  }, [isLoading]);

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {showSpinner && (
            <motion.div
              // 진입(initial)은 일부러 생략함(false) — 스피너 자신이 0→1로
              // 서서히 불투명해지는 동안, 그 반투명한 틈으로 뒤의 탭/정렬
              // 필터줄이 비쳐 보이는 문제가 있었음(탭과 스피너가 같은 순간에
              // 나타나기 시작해도, 스피너 쪽이 페이드인하는 중이라 즉시
              // 완전히 덮지 못했음). exit(사라질 때)는 그대로 애니메이션해서
              // 콘텐츠와의 크로스페이드는 유지함.
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: PAGE_TRANSITION_DURATION,
                ease: "easeInOut",
              }}
            >
              <LoadingScreen />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      {!isLoading && children}
    </>
  );
}
