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
  // 오차 측정 전엔 0(로컬 시계 그대로)으로 시작하고, 측정되면 그 값으로 갱신.
  // 카운트다운이 표시되자마자 살짝 튈 수는 있지만, 정확도가 훨씬 중요한 값이라 감수함.
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getServerTimeOffset()
      .then((o) => {
        if (!cancelled) setOffset(o);
      })
      .catch(() => {
        // 실패하면 그냥 로컬 시계(오차 0)로 계속 진행 — 카운트다운이 안 뜨는 것보단 나음
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const serverNow = () => Date.now() + offset;

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
  }, [openAt, offset]);

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
