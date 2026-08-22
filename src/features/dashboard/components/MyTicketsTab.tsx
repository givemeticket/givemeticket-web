import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/shared/components/EmptyState";
import { FilterDropdown } from "@/shared/components/FilterDropdown";
import { CampaignCard } from "@/features/campaign/components/CampaignCard";
import { listCampaigns } from "@/features/campaign/api/campaignApi";
import { formatDateTimeKo } from "@/shared/lib/formatDate";

const SORT_OPTIONS = [
  { value: "appliedAt", label: "신청 날짜" },
  { value: "openAt", label: "오픈 날짜" },
];

export function MyTicketsTab() {
  const navigate = useNavigate();
  const [showDeleted, setShowDeleted] = useState(false);
  // TODO: 백엔드가 신청 시각 필드를 목록에 내려주면 실제 정렬 로직 연결
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0].value);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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
        icon={<TicketIcon />}
        title="아직 신청한 행사가 없어요"
        description="공유받은 링크로 들어가서 신청하면 여기에 나타나요"
      />
    );
  }

  const visibleCampaigns = showDeleted
    ? campaigns
    : campaigns.filter((c) => c.status !== "DELETED");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <FilterDropdown
          sortOptions={SORT_OPTIONS}
          sortValue={sortBy}
          onSortChange={setSortBy}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          showDeleted={showDeleted}
          onShowDeletedChange={setShowDeleted}
        />
      </div>

      {visibleCampaigns.length === 0 ? (
        <p className="py-16 text-center text-sm text-(--muted)">
          아직 신청한 행사가 없어요
        </p>
      ) : (
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
      )}
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
