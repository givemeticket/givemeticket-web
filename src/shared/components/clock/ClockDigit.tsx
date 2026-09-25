import { useEffect, useRef, useState } from "react";

// 한 자리(0~9) 전용 "롤오버" 애니메이션 셀. claude.ai/design 템플릿은 바닐라
// DOM으로 이전 숫자를 clone하고 애니메이션이 끝나면 직접 remove했는데, 여긴
// 그 동작을 리액트 상태로 옮김: 값이 바뀌면 이전 레이어는 "나가는 중"으로
// 표시해 gmtOut을 재생하고, 새 레이어는 기본(gmtIn)으로 추가함. 나가는
// 레이어는 자기 애니메이션이 끝나는 순간(onAnimationEnd) 스스로 배열에서
// 빠짐 — 부모가 타이밍을 따로 잴 필요가 없음.
//
// 원래 features/dashboard의 HeaderLiveClock.tsx 안에 있었는데, features/landing의
// 서버 시계(templates/landing-ticket-intro도 같은 자리별 롤오버 애니메이션을 씀)가
// 그 파일에서 직접 import해 쓰면서 feature끼리 서로 참조하는 구조가 돼서 shared로
// 옮김.
export function ClockDigit({
  value,
  animate,
}: {
  value: string;
  animate: boolean;
}) {
  const [layers, setLayers] = useState<
    { key: number; value: string; leaving: boolean }[]
  >(() => [{ key: 0, value, leaving: false }]);
  const nextKeyRef = useRef(1);

  useEffect(() => {
    setLayers((prev) => {
      const current = prev[prev.length - 1];
      if (current.value === value) return prev;

      // 애니메이션을 껐을 땐(reduced motion) 레이어를 쌓지 않고 그대로
      // 교체함 — animationend가 아예 안 일어나는 애니메이션에 기대어
      // 정리하면 이전 레이어가 영원히 안 지워지고 쌓이기만 하기 때문.
      if (!animate) {
        return [{ key: nextKeyRef.current++, value, leaving: false }];
      }

      return [
        ...prev.map((layer) => ({ ...layer, leaving: true })),
        { key: nextKeyRef.current++, value, leaving: false },
      ];
    });
  }, [value, animate]);

  return (
    <span className="relative inline-block h-[1.25em] w-[0.6em] overflow-hidden align-bottom">
      {layers.map((layer) => (
        <span
          key={layer.key}
          className={`absolute inset-x-0 top-0 flex h-full items-center justify-center ${
            animate ? (layer.leaving ? "gmt-digit-out" : "gmt-digit-in") : ""
          }`}
          onAnimationEnd={() => {
            if (!layer.leaving) return;
            setLayers((prev) => prev.filter((l) => l.key !== layer.key));
          }}
        >
          {layer.value}
        </span>
      ))}
    </span>
  );
}
