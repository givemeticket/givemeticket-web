import { useEffect } from "react";

// 스크롤을 유발하는 키들. Spacebar는 구형 브라우저 호환용 값도 같이 둠.
const SCROLL_KEYS = new Set([
  " ",
  "Spacebar",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  "ArrowUp",
  "ArrowDown",
]);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
}

/** active일 때 사용자가 직접 시도하는 스크롤(휠/터치 드래그/스크롤 유발 키)만
 * 막음. document.body에 overflow:hidden을 거는 방식은 안 씀 — 스크롤 가능한
 * 범위 자체가 없어져서, 코드로 직접 부르는 window.scrollTo()(스크롤 오프셋
 * 보정의 스냅 등)까지 같이 막힐 위험이 있어서(scrollOffsetStore.ts 참고). 여기
 * 방식은 "사용자가 직접 일으키는 이벤트"만 막는 거라 그 위험이 없음.
 *
 * 입력창(input/textarea/contentEditable)에 포커스가 가 있으면 키보드 차단은
 * 건너뜀 — 안 그러면 그 안에서 스페이스바 입력 같은 게 막힘.
 */
export function useBlockUserScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;

    function preventWheel(e: WheelEvent) {
      e.preventDefault();
    }

    function preventTouchMove(e: TouchEvent) {
      e.preventDefault();
    }

    function preventScrollKey(e: KeyboardEvent) {
      if (isEditableTarget(document.activeElement)) return;
      if (SCROLL_KEYS.has(e.key)) e.preventDefault();
    }

    // wheel/touchmove는 브라우저가 성능상 기본적으로 passive로 처리해서,
    // preventDefault()가 조용히 무시될 수 있음 — { passive: false }로 명시해야 함.
    window.addEventListener("wheel", preventWheel, { passive: false });
    window.addEventListener("touchmove", preventTouchMove, { passive: false });
    window.addEventListener("keydown", preventScrollKey);

    return () => {
      window.removeEventListener("wheel", preventWheel);
      window.removeEventListener("touchmove", preventTouchMove);
      window.removeEventListener("keydown", preventScrollKey);
    };
  }, [active]);
}
