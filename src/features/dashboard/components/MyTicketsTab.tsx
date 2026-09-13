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
      pageTitle="나의 티켓"
      // 헤더/하단 탭(HeaderTabs.tsx/BottomTabBar.tsx)이 "나의 티켓" 목적지에
      // 쓰는 것과 같은 아이콘 — 제목만 봐도 어느 탭인지 바로 이어지게 함.
      titleIcon={<Ticket size={18} strokeWidth={1.8} />}
      emptyIcon={<Ticket size={24} strokeWidth={1.6} />}
      emptyTitle="아직 신청한 행사가 없어요"
      emptyDescription="공유받은 링크로 들어가서 신청하면 여기에 나타나요"
      fromKey="mytickets"
      sortOptions={SORT_OPTIONS}
    />
  );
}
