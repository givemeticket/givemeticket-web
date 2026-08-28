import { Ticket } from "lucide-react";
import { CampaignListTab } from "./CampaignListTab";

const SORT_OPTIONS = [
  { value: "appliedAt", label: "신청 날짜" },
  { value: "openAt", label: "오픈 날짜" },
];

export function MyTicketsTab() {
  return (
    <CampaignListTab
      scope="participated"
      emptyIcon={<Ticket size={24} strokeWidth={1.6} />}
      emptyTitle="아직 신청한 행사가 없어요"
      emptyDescription="공유받은 링크로 들어가서 신청하면 여기에 나타나요"
      fromKey="mytickets"
      sortOptions={SORT_OPTIONS}
    />
  );
}
