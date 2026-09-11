import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

// 데이터가 아직 없는 화면(리스트가 비어있는 경우)에서 공통으로 쓰는 안내 블록.
// 대시보드의 두 탭(나의 티켓 / 내가 만든 행사)이 이 컴포넌트를 공유합니다.
export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-2xl border px-6 py-16 text-center"
      style={{ borderColor: "var(--line)" }}
    >
      {/* 아이콘 색을 --brand-blue에서 --muted로 낮춤 — 액션이 없는 빈 화면에서
          가장 강한 색이 아이콘이 되던 문제를 없애고, 아래 설명 문구와 톤을
          맞춤. 브랜드 노랑(실제 액션 버튼)은 그대로 이 화면 안에서 가장 눈에
          띄는 색으로 남음. */}
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full text-(--muted)"
        style={{ backgroundColor: "var(--ink-soft)" }}
      >
        {icon}
      </div>
      <p className="text-base font-semibold text-(--paper)">{title}</p>
      <p className="max-w-xs text-sm leading-relaxed text-(--muted)">
        {description}
      </p>
    </div>
  );
}
