import { CampaignCard } from "@/features/campaign/components/CampaignCard";
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
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full text-(--brand-yellow)"
        style={{ backgroundColor: "var(--ink-soft)" }}
      >
        {icon}
      </div>
      <p className="text-base font-semibold text-(--paper)">{title}</p>
      <p className="max-w-xs text-sm leading-relaxed text-(--muted)">
        {description}
      </p>
      {/* 삭제 필요 */}
      <CampaignCard
        title="Example Campaign"
        status="SCHEDULED"
        openAtLabel="Open at"
      />
    </div>
  );
}
