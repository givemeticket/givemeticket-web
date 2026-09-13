import { useEffect, useRef, useState } from "react";
import { useServerNow } from "@/shared/hooks/useServerNow";
import { PrimaryButton } from "@/shared/components/buttons/PrimaryButton";
import { FixedWidthLabel } from "@/shared/components/buttons/FixedWidthLabel";

// 오픈 전(SCHEDULED) 상태일 때 쓰는 카운트다운 버튼.
// 서버 시각(useServerNow.ts)으로 오차를 보정하고, 클릭하면 실제 신청 API를
// 그대로 호출함(오픈 여부의 최종 판단은 항상 백엔드가 함 — 이 카운트다운은
// 표시용일 뿐).
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
  const serverNow = useServerNow();

  // 마운트되는 첫 렌더링 시점엔 서버 시각 오차 응답이 아직 온 적이 없어서
  // 오차가 항상 0(초기값)임이 보장됨 — 그래서 여기선 굳이 serverNow()(ref
  // 읽기)를 안 부르고 오차 0으로 직접 계산해도 결과가 같음. 렌더링 중엔
  // ref를 읽으면 안 된다는 규칙(react-hooks/refs) 때문.
  const [remainingMs, setRemainingMs] = useState(
    () => new Date(openAt).getTime() - Date.now(),
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
      ? "신청하기"
      : formatCountdown(remainingMs);

  const isUrgent = remainingMs > 0 && remainingMs <= 60_000;

  // 카운트다운이 끝나 "신청하기"로 바뀐 뒤에도, 오픈 이후 새로고침해서
  // ApplySection이 이 컴포넌트 대신 평범한 "신청하기" 버튼을 그릴 때도 버튼
  // 너비가 똑같아야 함 — 그래서 너비를 맞추는 트릭을 이 컴포넌트 안에 두는
  // 대신 FixedWidthLabel로 분리해서 "신청하기"/"신청 취소" 버튼과 같은
  // minWidthText("00:00:00")를 공유함.
  return (
    <PrimaryButton onClick={handleClick} disabled={isActing} urgent={isUrgent}>
      <FixedWidthLabel text={label} minWidthText="00:00:00" />
    </PrimaryButton>
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
