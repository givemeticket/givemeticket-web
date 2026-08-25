import { CalendarPlus } from "lucide-react";
import { CampaignListTab } from "./CampaignListTab";

export function MyCampaignsTab() {
  return (
    <CampaignListTab
      scope="owned"
      emptyIcon={<CalendarPlus size={22} strokeWidth={1.7} />}
      emptyTitle="아직 만든 행사가 없어요"
      emptyDescription="첫 행사를 열어서 선착순 신청을 받아보세요"
      fromKey="mycampaigns"
    />
  );
}
