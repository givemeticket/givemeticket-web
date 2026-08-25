import { Ticket } from "lucide-react";
import { CampaignListTab } from "./CampaignListTab";

export function MyTicketsTab() {
  return (
    <CampaignListTab
      scope="participated"
      emptyIcon={<Ticket size={24} strokeWidth={1.6} />}
      emptyTitle="아직 신청한 행사가 없어요"
      emptyDescription="공유받은 링크로 들어가서 신청하면 여기에 나타나요"
      fromKey="mytickets"
    />
  );
}
