import type { ReactNode } from "react";

interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** 임박 상태 강조 — 배경색을 경고색으로, 미세한 펄스 애니메이션 추가 */
  urgent?: boolean;
  /** 폼 제출용으로 쓸 때 "submit"으로. 기본은 "button" */
  type?: "button" | "submit";
}

// 노란색 배경의 주요 액션 버튼(신청하기 등). urgent가 켜지면 "곧 마감/오픈" 같은
// 긴급한 상태를 경고색+펄스로 강조함(예: CountdownApplyButton의 임박 카운트다운).
// 내용물 크기만큼만 차지함 — 가로로 꽉 채우는 옵션이 있었는데 실제로 쓰는 곳이
// 하나도 없어서(전부 fullWidth={false}) 그냥 없애고 이걸 기본 동작으로 함.
export function PrimaryButton({
  children,
  onClick,
  disabled,
  urgent = false,
  type = "button",
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-4 py-3 text-sm font-semibold transition-transform enabled:hover:scale-[1.02] enabled:active:scale-[0.98] disabled:opacity-40 ${urgent ? "countdown-urgent text-(--on-brand)" : "text-(--on-yellow)"}`}
      style={{
        backgroundColor: urgent ? "var(--warn)" : "var(--brand-yellow)",
      }}
    >
      {children}
    </button>
  );
}
