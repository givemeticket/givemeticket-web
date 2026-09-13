import { useEffect, useRef } from "react";
import { getServerTimeOffset } from "@/shared/lib/serverTime";

/**
 * 서버-클라이언트 시계 오차로 보정한 "지금"을 계산해주는 함수를 돌려줌.
 * HeaderLiveClock.tsx와 CountdownApplyButton.tsx가 각자 거의 똑같이 구현하고
 * 있던 걸 하나로 모음.
 *
 * 오차를 state가 아니라 ref로 들고 있음 — state였다면, 오차 측정 API 응답이
 * 도착해서 갱신될 때마다 이 값에 기대는 setInterval 이펙트들이 재실행되며
 * 타이머를 통째로 재시작함. 재시작된 타이머는 그 순간부터 다시 1초를 꽉
 * 채워야 다음 틱이 오니까, 화면 숫자가 최대 1~2초 가까이 멈춰있는 것처럼
 * 보이는 버그로 이어짐(두 컴포넌트 모두에서 실제 재현 확인함). ref로 두면
 * 값이 갱신돼도 리렌더/이펙트 재실행이 없어서, 타이머는 처음 그대로 쭉
 * 이어지고 매 틱마다 그 시점의 최신 오차만 조용히 반영됨.
 *
 * 반환하는 함수 자체는 매 렌더 새로 만들어지는 새 참조라 useEffect
 * deps에 넣기엔 안 맞음 — setInterval 콜백처럼 "호출되는 시점의 최신 오차"만
 * 필요한 곳에서 그때그때 불러 쓰는 용도로 씀(HeaderLiveClock.tsx/
 * CountdownApplyButton.tsx 사용 예 참고).
 */
export function useServerNow(): () => number {
  const offsetRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    getServerTimeOffset()
      .then((offset) => {
        if (!cancelled) offsetRef.current = offset;
      })
      .catch(() => {
        // 실패하면 로컬 시계(오차 0)로 계속 진행 — 아예 안 뜨는 것보단 나음.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return () => Date.now() + offsetRef.current;
}
