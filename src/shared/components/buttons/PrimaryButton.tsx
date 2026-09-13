import type { ReactNode } from "react";

interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** 임박 상태 강조 — 배경색을 긴급색(urgent)으로, 미세한 펄스 애니메이션 추가 */
  urgent?: boolean;
  /** 되돌릴 수 없는 위험한 동작(삭제 등) 강조 — 배경색을 경고색(--warn)으로.
   * urgent와 동시에 켤 일은 없음(하나의 버튼이 "임박"이면서 "위험한 동작"인
   * 경우가 없어서) — 둘 다 켜지면 danger가 우선함. ConfirmDialog.tsx가
   * 예전엔 이 톤만을 위해 같은 모양의 버튼을 직접 새로 그리고 있었는데,
   * 그 하드코딩을 없애고 여기로 흡수함. */
  danger?: boolean;
  /** 폼 제출용으로 쓸 때 "submit"으로. 기본은 "button" */
  type?: "button" | "submit";
}

// 노란색 배경의 주요 액션 버튼(신청하기 등). urgent가 켜지면 "곧 마감/오픈" 같은
// 긴급한 상태를 긴급색(--urgent)+펄스로 강조함(예: CountdownApplyButton의 임박 카운트다운).
// danger가 켜지면 되돌릴 수 없는 위험한 동작을 경고색(--warn)으로 강조함(예:
// ConfirmDialog의 삭제 확인 버튼). 내용물 크기만큼만 차지함 — 가로로 꽉 채우는
// 옵션이 있었는데 실제로 쓰는 곳이 하나도 없어서(전부 fullWidth={false}) 그냥
// 없애고 이걸 기본 동작으로 함.
export function PrimaryButton({
  children,
  onClick,
  disabled,
  urgent = false,
  danger = false,
  type = "button",
}: PrimaryButtonProps) {
  const backgroundColor = danger
    ? "var(--warn)"
    : urgent
      ? "var(--urgent)"
      : "var(--brand-yellow)";
  const toneClassName = danger
    ? "text-(--on-brand)"
    : urgent
      ? "countdown-urgent text-(--on-brand)"
      : "text-(--on-yellow)";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-4 py-3 text-sm font-semibold transition-transform enabled:hover:scale-[1.02] enabled:active:scale-[0.98] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-blue) ${toneClassName}`}
      style={{ backgroundColor }}
    >
      {children}
    </button>
  );
}
