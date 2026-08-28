import type { ReactNode } from "react";

interface SecondaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

// 테두리만 있는 보조 액션 버튼(신청 취소, 비활성 안내 문구 등). 내용물 크기만큼만
// 차지함 — 가로로 꽉 채우는 옵션이 있었는데 실제로 쓰는 곳이 없어서 없앰.
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
      className="rounded-full border px-4 py-3 text-sm font-semibold disabled:opacity-40"
      style={{ borderColor: "var(--line)", color: "var(--paper)" }}
    >
      {children}
    </button>
  );
}
