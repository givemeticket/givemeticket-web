import { useNavigate, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/shared/components/EmptyState";
import { CampaignCard } from "@/features/campaign/components/CampaignCard";
import { listCampaigns } from "@/features/campaign/api/campaignApi";
import { formatDateTimeKo } from "@/shared/lib/formatDate";
import type { DashboardOutletContext } from "../pages/DashboardLayout";

export function MyCampaignsTab() {
  const navigate = useNavigate();
  // 정렬/삭제표시 상태는 탭 바 옆에 필터 버튼을 두려고 DashboardLayout이 대신 들고 있음
  const { showDeleted } = useOutletContext<DashboardOutletContext>();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns", "owned"],
    queryFn: () => listCampaigns("owned"),
  });

  if (isLoading) {
    return (
      <p className="py-16 text-center text-sm text-(--muted)">불러오는 중...</p>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <EmptyState
        icon={<PlusIcon />}
        title="아직 만든 행사가 없어요"
        description="첫 행사를 열어서 선착순 신청을 받아보세요"
      />
    );
  }

  const visibleCampaigns = showDeleted
    ? campaigns
    : campaigns.filter((c) => c.status !== "DELETED");

  if (visibleCampaigns.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-(--muted)">
        아직 만든 행사가 없어요
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {visibleCampaigns.map((c) => (
        <CampaignCard
          key={c.id}
          title={c.title}
          status={c.status}
          soldOut={c.soldOut ?? false}
          openAtLabel={`${formatDateTimeKo(c.openAt)} 오픈`}
          remainingStock={
            c.totalStock != null && c.remainingStock != null
              ? c.remainingStock
              : undefined
          }
          totalStock={c.totalStock ?? undefined}
          ownerNickname={c.owner.nickname}
          ownerProfileImageUrl={c.owner.profileImageUrl}
          onClick={() =>
            navigate(`/campaigns/${c.shortCode}`, {
              state: { from: "mycampaigns" },
            })
          }
        />
      ))}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 8v8M8 12h8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
