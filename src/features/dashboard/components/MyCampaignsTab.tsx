import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/shared/components/EmptyState";
import { FilterDropdown } from "@/shared/components/FilterDropdown";
import { CampaignCard } from "@/features/campaign/components/CampaignCard";
import { listCampaigns } from "@/features/campaign/api/campaignApi";
import { formatDateTimeKo } from "@/shared/lib/formatDate";

const SORT_OPTIONS = [
  { value: "createdAt", label: "만든 날짜" },
  { value: "openAt", label: "오픈 날짜" },
];

export function MyCampaignsTab() {
  const navigate = useNavigate();
  const [showDeleted, setShowDeleted] = useState(false);
  // TODO: 백엔드가 생성 시각 필드를 목록에 내려주면 실제 정렬 로직 연결
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0].value);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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
          아직 만든 행사가 없어요
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
                  state: { from: "mycampaigns" },
                })
              }
            />
          ))}
        </div>
      )}
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
