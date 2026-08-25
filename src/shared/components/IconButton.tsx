import type { ReactNode } from "react";

interface IconButtonProps {
  children: ReactNode;
  onClick: () => void;
  /** aria-label과 title(호버 툴팁)로 동시에 씀 */
  label: string;
  /** sm=32px(h-8 w-8), md=36px(h-9 w-9). 기본 md */
  size?: "sm" | "md";
  /** 눌린/열린/선택된 상태 강조(강조색 + 은은한 배경) */
  active?: boolean;
  disabled?: boolean;
  /** warn이면 색 자체를 경고색으로 고정(삭제 같은 위험한 동작용) */
  tone?: "default" | "warn";
}

// 원형 아이콘 버튼. 예전엔 필터/달력 이전달·다음달/행사 만들기/관리 아이콘들이
// 전부 각자 따로 h-8·h-9 + rounded-full + hover:bg-(--ink-soft) 조합을 손으로
// 반복하고 있었어서 하나로 모음.
export function IconButton({
  children,
  onClick,
  label,
  size = "md",
  active = false,
  disabled = false,
  tone = "default",
}: IconButtonProps) {
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const color =
    tone === "warn"
      ? "var(--warn)"
      : active
        ? "var(--brand-blue)"
        : "var(--muted)";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full transition-colors hover:bg-(--ink-soft) disabled:opacity-40`}
      style={{ color, backgroundColor: active ? "var(--ink-soft)" : undefined }}
    >
      {children}
    </button>
  );
}
