import { useEffect, useRef, useState } from "react";
import { getServerTimeOffset } from "@/shared/lib/serverTime";
import { PrimaryButton } from "@/shared/components/buttons/PrimaryButton";

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

  // 마운트되는 첫 렌더링 시점엔 서버 시각 오차 응답이 아직 온 적이 없어서
  // offsetRef.current가 항상 0(초기값)임이 보장됨 — 그래서 여기선 굳이
  // serverNow()(ref 읽기)를 안 부르고 오차 0으로 직접 계산해도 결과가 같음.
  // 렌더링 중엔 ref를 읽으면 안 된다는 규칙(react-hooks/refs) 때문.
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
      : `오픈까지 ${formatCountdown(remainingMs)} 남았어요`;

  const isUrgent = remainingMs > 0 && remainingMs <= 60_000;

  // 카운트다운 텍스트 길이가 계속 바뀌면서(며칠 단위 -> 시:분:초 단위 -> "신청하기")
  // 버튼 크기도 같이 늘었다 줄었다 하면 산만해 보임. "오픈까지 00:00:00 남았어요"
  // (가장 긴 경우)를 안 보이게 같은 자리에 겹쳐서, 그 텍스트 크기만큼 버튼 너비를
  // 항상 확보해둠 — CSS Grid로 두 텍스트를 같은 칸에 겹쳐두면, 그 칸의 크기는
  // 둘 중 더 큰 쪽(안 보이는 최대 길이 텍스트)에 맞춰짐.
  return (
    <PrimaryButton onClick={handleClick} disabled={isActing} urgent={isUrgent}>
      <span className="grid">
        <span className="invisible col-start-1 row-start-1" aria-hidden="true">
          오픈까지 00:00:00 남았어요
        </span>
        <span className="col-start-1 row-start-1">{label}</span>
      </span>
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
