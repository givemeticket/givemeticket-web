import type { ReactNode } from "react";
import { Tooltip } from "../overlay/Tooltip";

interface IconButtonProps {
  children: ReactNode;
  onClick: () => void;
  /** aria-label과 호버 툴팁 문구로 동시에 씀 */
  label: string;
  /** 원래 sm=32px/md=36px로 구분됐었으나, 모바일 터치 타겟 권장 최소
   * 크기(44px)에 못 미쳐서 체감 확인 후 둘 다 44px로 통일 확정함 —
   * 지금은 시각적으로 아무 차이가 없음. prop 자체는 나중에 다시 구분이
   * 필요해질 경우를 위해 남겨둠. */
  size?: "sm" | "md";
  /** 눌린/열린/선택된 상태 강조(강조색 + 은은한 배경) */
  active?: boolean;
  disabled?: boolean;
  /** warn이면 색 자체를 경고색으로 고정(삭제 같은 위험한 동작용) */
  tone?: "default" | "warn";
  /** 내부 Tooltip에 그대로 전달함 — 화면/컨테이너 왼쪽 가장자리에 가까운
   * 버튼이면 "left"로 줘서 툴팁이 잘리지 않게 함(Tooltip.tsx 참고) */
  align?: "center" | "left";
}

// 원형 아이콘 버튼. 예전엔 필터/달력 이전달·다음달/행사 만들기/관리 아이콘들이
// 전부 각자 따로 h-8·h-9 + rounded-full + hover:bg-(--ink-soft) 조합을 손으로
// 반복하고 있었어서 하나로 모음.
// 44px(h-11 w-11)로 고정 — 원래 sm/md로 나뉘어 있던 32px/36px가 모바일 터치
// 타겟 권장 최소 크기(44px)에 못 미쳐서, 실제로 체감해본 뒤 정식으로 확정함.
export function IconButton({
  children,
  onClick,
  label,
  active = false,
  disabled = false,
  tone = "default",
  align = "center",
}: IconButtonProps) {
  const color =
    tone === "warn"
      ? "var(--warn)"
      : active
        ? "var(--brand-blue)"
        : "var(--muted)";

  return (
    <Tooltip content={label} align={align}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-(--ink-soft) disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand-blue)"
        style={{
          color,
          backgroundColor: active ? "var(--ink-soft)" : undefined,
        }}
      >
        {children}
      </button>
    </Tooltip>
  );
}
