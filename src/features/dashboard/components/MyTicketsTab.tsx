import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/shared/components/EmptyState";
import { CampaignCard } from "@/features/campaign/components/CampaignCard";
import { listCampaignsWithStock } from "@/features/campaign/api/campaignApi";
import { formatDateTimeKo } from "@/shared/lib/formatDate";

export function MyTicketsTab() {
  const navigate = useNavigate();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns", "participated"],
    queryFn: () => listCampaignsWithStock("participated"),
  });

  if (isLoading) {
    return (
      <p className="py-16 text-center text-sm text-(--muted)">불러오는 중...</p>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <EmptyState
        icon={<TicketIcon />}
        title="아직 신청한 행사가 없어요"
        description="공유받은 링크로 들어가서 신청하면 여기에 나타나요"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {campaigns.map((c) => (
        <CampaignCard
          key={c.id}
          title={c.title}
          status={c.status}
          soldOut={c.soldOut}
          openAtLabel={`${formatDateTimeKo(c.openAt)} 오픈`}
          remainingStock={c.totalStock != null ? c.remainingStock : undefined}
          totalStock={c.totalStock ?? undefined}
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

function TicketIcon() {
  return (
    <svg
      width="24"
      height="20"
      viewBox="0 0 32 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v2a2 2 0 1 0 0 4v2a2 2 0 1 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 1 0 0-4v-4a2 2 0 1 0 0-4Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <line
        x1="16"
        y1="5"
        x2="16"
        y2="19"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeDasharray="2 2.4"
      />
    </svg>
  );
}
