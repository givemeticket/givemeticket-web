import type { ReactNode } from "react";

interface SecondaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

// 테두리만 있는 보조 액션 버튼(신청 취소, 비활성 안내 문구 등).
export function SecondaryButton({
  children,
  onClick,
  disabled,
}: SecondaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full border px-4 py-3 text-sm font-semibold disabled:opacity-40"
      style={{ borderColor: "var(--line)", color: "var(--paper)" }}
    >
      {children}
    </button>
  );
}
