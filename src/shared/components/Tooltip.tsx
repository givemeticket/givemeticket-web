import type { ReactNode } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
}

// 브라우저 기본 title 속성 대신 쓰는 스타일링된 툴팁. CSS만으로(group-hover)
// 동작해서 별도 state/JS 없이 가벼움. 트리거 바로 위에 뜨고, 작은 꼬리로 이어짐
// (UserMenu 드롭다운 꼬리랑 같은 기법 — 45도 회전시킨 정사각형).
export function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-56 -translate-x-1/2 rounded-lg px-2.5 py-1.5 text-xs font-medium opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
        style={{
          backgroundColor: "var(--ink)",
          color: "var(--paper)",
          border: "1px solid var(--line)",
        }}
      >
        {content}
        <span
          className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r"
          style={{ backgroundColor: "var(--ink)", borderColor: "var(--line)" }}
        />
      </span>
    </span>
  );
}
