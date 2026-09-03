import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { consumePendingScrollOffset } from "./scrollOffsetStore";
import { POST_ANIMATION_DELAY_MS } from "../animationDurations";

// "목록↔상세 카드 이동 애니메이션 중 스크롤 오프셋을 걸어뒀다가, 애니메이션이
// 끝나면 오프셋을 없애면서 동시에 실제 스크롤을 목표값으로 맞추는" 처리를
// CampaignDetailPage.tsx와 CampaignListTab.tsx가 거의 똑같이 중복 구현하고
// 있던 걸 통합함. 유일한 차이는 "최종적으로 어디로 스크롤할지"뿐이라, 그 계산만
// 인자로 받음 — CampaignDetailPage는 도착 페이지 자신의 저장된 스크롤 위치로,
// CampaignListTab은 현재 스크롤에서 오프셋만큼 빼는 방식으로 각자 다르게 계산함.
export function useScrollOffsetSnap(
  computeTargetScrollY: (pendingOffset: number) => number,
) {
  // 마운트 시점에 한 번만 소비함(consume-once) — 관련 없는 다음 마운트에 옛날
  // 값이 남아있지 않도록.
  const [pendingScrollOffset] = useState(() => consumePendingScrollOffset());
  // 오프셋이 실제로 걸려있는 상태인지. 애니메이션이 끝나면 false로 바뀌면서
  // 오프셋을 제거함과 동시에 진짜 스크롤을 목표값으로 맞춤 — 이 둘이 정확히
  // 동시에 일어나야 화면상 아무 변화 없이 "순간이동"됨(scrollOffsetStore.ts 참고).
  const [isScrollOffsetActive, setIsScrollOffsetActive] = useState(
    pendingScrollOffset !== null,
  );
  // 오프셋을 없애는 그 순간, 카드의 이동 duration을 0으로 강제해서 즉시 반영되게
  // 함 — 안 그러면 오프셋 제거로 카드 측정 위치가 바뀌는 걸 Framer Motion이 "또
  // 다른 이동"으로 착각해서, 의도치 않은 두 번째 애니메이션을 자체적으로
  // 걸어버리는 문제가 있었음(로그로 확인함).
  const [hasSnappedScrollOffset, setHasSnappedScrollOffset] = useState(false);

  useEffect(() => {
    if (pendingScrollOffset === null) return;
    // 카드 이동 + 페이지 페이드가 전부 통일된 duration이라, 그 시간만큼만
    // 기다리면 됨(여유분 조금 추가)
    const timer = setTimeout(() => {
      // window.scrollTo는 즉시 반영되는데, 오프셋 제거(state 변경)는 리액트의
      // 다음 렌더링까지 기다림 — 이 둘 사이에 "스크롤은 바뀌었는데 오프셋은 아직
      // 안 없어진" 짧은 순간이 그대로 화면에 그려져서, 카드가 잠깐 순간이동했다
      // 나타나는 것처럼 보이는 문제가 있었음. flushSync로 오프셋 제거(및 그 결과
      // 리렌더링/DOM 반영)를 먼저 동기적으로 완전히 끝내고, 그 다음에 스크롤을
      // 바꿔서 그 틈이 안 생기게 함.
      flushSync(() => {
        setIsScrollOffsetActive(false);
        setHasSnappedScrollOffset(true);
      });
      window.scrollTo(0, computeTargetScrollY(pendingScrollOffset));
    }, POST_ANIMATION_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { pendingScrollOffset, isScrollOffsetActive, hasSnappedScrollOffset };
}
