import { useEffect, type RefObject } from "react";

/**
 * ref로 감싼 요소 바깥을 클릭하면 onOutside를 호출함. active가 false면 아예
 * 리스너를 안 등록함(드롭다운이 닫혀있을 때 불필요한 이벤트 리스너를 안 달아두려고).
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;

    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOutside();
      }
    }

    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [active, ref, onOutside]);
}
