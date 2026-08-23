import { useNavigate, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Ticket } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { CampaignCard } from "@/features/campaign/components/CampaignCard";
import { listCampaigns } from "@/features/campaign/api/campaignApi";
import { formatDateTimeKo } from "@/shared/lib/formatDate";
import type { DashboardOutletContext } from "../pages/DashboardLayout";

export function MyTicketsTab() {
  const navigate = useNavigate();
  // 정렬/삭제표시 상태는 탭 바 옆에 필터 버튼을 두려고 DashboardLayout이 대신 들고 있음
  const { showDeleted } = useOutletContext<DashboardOutletContext>();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns", "participated"],
    queryFn: () => listCampaigns("participated"),
  });

  if (isLoading) {
    return (
      <p className="py-16 text-center text-sm text-(--muted)">불러오는 중...</p>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <EmptyState
        icon={<Ticket size={24} strokeWidth={1.6} />}
        title="아직 신청한 행사가 없어요"
        description="공유받은 링크로 들어가서 신청하면 여기에 나타나요"
      />
    );
  }

  const visibleCampaigns = showDeleted
    ? campaigns
    : campaigns.filter((c) => c.status !== "DELETED");

  if (visibleCampaigns.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-(--muted)">
        아직 신청한 행사가 없어요
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
              state: { from: "mytickets" },
            })
          }
        />
      ))}
    </div>
  );
}
