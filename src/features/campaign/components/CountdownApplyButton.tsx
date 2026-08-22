import { useEffect, useRef, useState } from "react";
import { getServerTimeOffset } from "@/shared/lib/serverTime";

// 오픈 전(SCHEDULED) 상태일 때 쓰는 카운트다운 버튼.
// 서버 시각으로 오차를 보정하고, 클릭하면 실제 신청 API를 그대로 호출함
// (오픈 여부의 최종 판단은 항상 백엔드가 함 — 이 카운트다운은 표시용일 뿐).
export function CountdownApplyButton({
  openAt,
  isActing,
  onClick,
  onExpire,
}: {
  openAt: string;
  isActing: boolean;
  onClick: () => void;
  onExpire: () => void;
}) {
  // offset을 state가 아니라 ref로 들고 있음 — state였다면, 오차 측정 API 응답이
  // 도착해서 offset이 갱신될 때마다 아래 setInterval 이펙트가 [openAt, offset]
  // 의존성 때문에 타이머를 통째로 재시작했음. 재시작된 타이머는 그 순간부터 다시
  // 1초를 꽉 채워야 다음 틱이 오니까, 화면 숫자가 최대 2초 가까이 멈춰있는 것처럼
  // 보이는 버그가 있었음. ref로 바꾸면 값이 갱신돼도 리렌더/이펙트 재실행이 없어서,
  // 타이머는 처음 그대로 쭉 이어지고 매 틱마다 그 시점의 최신 오차만 조용히 반영됨.
  const offsetRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    getServerTimeOffset()
      .then((o) => {
        if (!cancelled) offsetRef.current = o;
      })
      .catch(() => {
        // 실패하면 그냥 로컬 시계(오차 0)로 계속 진행 — 카운트다운이 안 뜨는 것보단 나음
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const serverNow = () => Date.now() + offsetRef.current;

  const [remainingMs, setRemainingMs] = useState(
    () => new Date(openAt).getTime() - serverNow(),
  );
  // 실제 API를 호출하는 버튼이라, 오픈 직전 광클로 요청이 과도하게 나가지 않도록
  // 아주 짧은 디바운스만 걸어둠 (isActing 중엔 어차피 막히지만, 응답이 빨리 오면
  // 바로 또 눌릴 수 있어서 이 정도 여유를 둠)
  const lastClickAtRef = useRef(0);
  const DEBOUNCE_MS = 200;

  useEffect(() => {
    const timer = setInterval(() => {
      const next = new Date(openAt).getTime() - serverNow();
      setRemainingMs(next);
      if (next <= 0) {
        clearInterval(timer);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAt]);

  function handleClick() {
    const now = Date.now();
    if (now - lastClickAtRef.current < DEBOUNCE_MS) return;
    lastClickAtRef.current = now;
    onClick();
  }

  const label = isActing
    ? "처리 중..."
    : remainingMs <= 0
      ? "오픈됐어요"
      : `오픈까지 ${formatCountdown(remainingMs)} 남았어요`;

  const isUrgent = remainingMs > 0 && remainingMs <= 60_000;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isActing}
      className={`w-full rounded-full px-4 py-3 text-sm font-semibold transition-transform enabled:hover:scale-[1.02] enabled:active:scale-[0.98] disabled:opacity-40 ${isUrgent ? "countdown-urgent text-(--on-brand)" : "text-(--on-yellow)"}`}
      style={{
        backgroundColor: isUrgent ? "var(--warn)" : "var(--brand-yellow)",
      }}
    >
      {label}
    </button>
  );
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);

  if (days >= 1) {
    return `${days}일`;
  }

  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
