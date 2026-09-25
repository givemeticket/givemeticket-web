import { CalendarDays, CalendarPlus } from "lucide-react";
import { CampaignListTab } from "./CampaignListTab";

const SORT_OPTIONS = [
  { value: "createdAt", label: "만든 날짜" },
  { value: "openAt", label: "오픈 날짜" },
];

export function MyCampaignsTab() {
  return (
    <CampaignListTab
      scope="owned"
      pageTitle="나의 행사"
      // 헤더/하단 탭(HeaderTabs.tsx/BottomTabBar.tsx)이 "나의 행사" 목적지에
      // 쓰는 것과 같은 아이콘(CalendarDays) — 빈 상태용 CalendarPlus(아래)와는
      // 별개, 제목만 봐도 어느 탭인지 바로 이어지게 함.
      titleIcon={<CalendarDays size={18} strokeWidth={1.8} />}
      emptyIcon={<CalendarPlus size={22} strokeWidth={1.7} />}
      emptyTitle="아직 만든 행사가 없어요"
      emptyDescription="첫 행사를 열어서 선착순 신청을 받아보세요"
      fromKey="mycampaigns"
      sortOptions={SORT_OPTIONS}
    />
  );
}
